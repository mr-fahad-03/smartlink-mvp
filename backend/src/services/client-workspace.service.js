const { requireSupabase } = require("../utils/supabase-guard");
const { AppError } = require("../utils/app-error");

async function getClientDashboardOverview(email) {
  const supabase = requireSupabase();

  // 1. Fetch lead submissions for this client by email
  const { data: leads, error: leadsError } = await supabase
    .from("lead_submissions")
    .select("*")
    .eq("work_email", email)
    .order("created_at", { ascending: false });

  if (leadsError) {
    throw new AppError("Failed to fetch lead submissions.", 500, leadsError.message);
  }

  // 2. Fetch introduction requests for this client by email
  const { data: connections, error: connectionsError } = await supabase
    .from("introduction_requests")
    .select("*")
    .eq("lead_email", email)
    .order("created_at", { ascending: false });

  if (connectionsError) {
    throw new AppError("Failed to fetch introduction requests.", 500, connectionsError.message);
  }

  // 3. For each introduction request, fetch the rich expert profile
  const expertIds = Array.from(new Set((connections || []).map(c => c.expert_id)));
  let expertsMap = {};
  let expertEmailsMap = {};
  if (expertIds.length > 0) {
    const { data: experts, error: expertsError } = await supabase
      .from("experts")
      .select("expert_id, name, role, organization, average_response_time, rating, service_tags, category_tags, location, is_verified, tier")
      .in("expert_id", expertIds);

    if (expertsError) {
      throw new AppError("Failed to fetch experts for connections.", 500, expertsError.message);
    }

    (experts || []).forEach(exp => {
      expertsMap[exp.expert_id] = exp;
    });

    // Fetch emails for linked users of these experts
    const { data: links } = await supabase
      .from("expert_user_links")
      .select("expert_id, user_id")
      .in("expert_id", expertIds);
    
    if (links && links.length > 0) {
      const userIds = links.map(l => l.user_id);
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const profileEmails = {};
      (profiles || []).forEach(p => {
        profileEmails[p.user_id] = p.email;
      });

      links.forEach(l => {
        if (profileEmails[l.user_id]) {
          expertEmailsMap[l.expert_id] = profileEmails[l.user_id];
        }
      });
    }
  }

  // 4. Fetch public reviews written by this client user
  const leadIds = (leads || []).map(l => l.id).filter(Boolean);
  let reviews = [];
  if (leadIds.length > 0) {
    const { data: reviewsData, error: reviewsError } = await supabase
      .from("expert_reviews")
      .select("*")
      .in("lead_id", leadIds);

    if (reviewsError) {
      throw new AppError("Failed to fetch reviews.", 500, reviewsError.message);
    }
    reviews = reviewsData || [];
  }

  // Enrich connections with expert details
  const enrichedConnections = (connections || []).map(conn => {
    const exp = expertsMap[conn.expert_id] || {
      name: conn.expert_name,
      role: "Expert",
    };
    return {
      ...conn,
      expert: {
        ...exp,
        email: conn.status === "accepted" ? (expertEmailsMap[conn.expert_id] || "Email not linked") : "Contact hidden until accepted"
      }
    };
  });

  // Calculate high-level metrics
  const totalSubmissions = leads ? leads.length : 0;
  const activeConnections = enrichedConnections.filter(c => c.status === "accepted").length;
  const pendingConnections = enrichedConnections.filter(c => c.status === "submitted" || c.status === "pending").length;
  const reviewsWritten = reviews ? reviews.length : 0;

  const metrics = {
    totalSubmissions,
    activeConnections,
    pendingConnections,
    reviewsWritten,
  };

  return {
    leads: leads || [],
    connections: enrichedConnections,
    reviews: reviews || [],
    metrics,
  };
}

async function submitClientReview(userId, email, payload) {
  const supabase = requireSupabase();

  // Validate the lead exists and belongs to this client email
  const { data: lead, error: leadError } = await supabase
    .from("lead_submissions")
    .select("id, work_email")
    .eq("id", payload.leadId)
    .single();

  if (leadError || !lead) {
    throw new AppError("Lead submission not found.", 404);
  }

  if (lead.work_email.toLowerCase() !== email.toLowerCase()) {
    throw new AppError("You do not have permission to review this match.", 403);
  }

  // Insert review directly (bypassing token check since authenticated)
  const insertRow = {
    lead_id: payload.leadId,
    expert_id: payload.expertId,
    user_id: userId,
    match_helpful_rating: payload.matchHelpfulRating || null,
    feedback_reason: payload.feedbackReason || [],
    public_star_rating: payload.publicStarRating,
    public_review_comment: payload.publicReviewComment || null,
    would_recommend: payload.wouldRecommend ?? null,
    review_status: "pending", // Default to pending moderation
  };

  const { data: review, error: reviewError } = await supabase
    .from("expert_reviews")
    .insert(insertRow)
    .select("*")
    .single();

  if (reviewError) {
    throw new AppError("Failed to create review.", 500, reviewError.message);
  }

  return review;
}

module.exports = {
  getClientDashboardOverview,
  submitClientReview,
};
