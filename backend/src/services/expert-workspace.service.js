const { requireSupabase } = require("../utils/supabase-guard");

async function getDashboardOverview(userId) {
  const supabase = requireSupabase();

  // Resolve expert_id from expert_user_links first
  const { data: link, error: linkError } = await supabase
    .from("expert_user_links")
    .select("expert_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (linkError) {
    throw linkError;
  }

  const expertId = link?.expert_id || userId;

  // 1. Fetch expert details
  const { data: expert } = await supabase
    .from("experts")
    .select("*")
    .eq("expert_id", expertId)
    .single();

  // 2. Fetch introduction requests (Opportunities & Clients)
  const { data: requests } = await supabase
    .from("introduction_requests")
    .select("*")
    .eq("expert_id", expertId);

  const reqs = requests || [];
  
  // Calculate Metrics
  const pendingRequests = reqs.filter(r => r.status === 'submitted' || r.status === 'pending');
  const activeClients = reqs.filter(r => r.status === 'accepted');
  const allCompleted = reqs.filter(r => r.status === 'accepted' || r.status === 'declined' || r.status === 'completed');
  
  const responseRate = reqs.length > 0 
    ? Math.round((allCompleted.length / reqs.length) * 100) + "%" 
    : "100%";
    
  const conversionRate = reqs.length > 0
    ? Math.round((activeClients.length / reqs.length) * 100) + "%"
    : "0%";

  // Try fetching impressions for Analytics
  const { data: impressions } = await supabase
    .from("expert_impression_events")
    .select("*")
    .eq("expert_id", expertId);
    
  const profileViews = impressions ? impressions.length : 0;
  
  // Aggregate impressions by date for charts
  const impressionsByDate = {};
  (impressions || []).forEach(imp => {
    const date = new Date(imp.created_at).toLocaleDateString();
    impressionsByDate[date] = (impressionsByDate[date] || 0) + 1;
  });
  
  const analytics = {
    impressionsByDate: Object.keys(impressionsByDate).map(date => ({
      date,
      views: impressionsByDate[date]
    }))
  };

  // Fetch reviews
  const { data: reviewsData } = await supabase
    .from("expert_reviews")
    .select("*")
    .eq("expert_id", expertId)
    .order("created_at", { ascending: false });

  const reviews = (reviewsData || []).map(r => ({
    id: r.id,
    author: r.client_name || "Anonymous Client",
    rating: r.rating || 5,
    comment: r.feedback_text || "",
    date: r.created_at
  }));

  const metrics = {
    newMatches: pendingRequests.length,
    pendingRequests: pendingRequests.length,
    activeClients: activeClients.length,
    responseRate,
    averageResponseTime: expert?.average_response_time ? `${expert.average_response_time} hours` : "N/A",
    rating: expert?.rating || 0,
    profileViews: profileViews || 0,
    conversionRate,
  };

  // Build action items from pending requests
  const actionItems = pendingRequests.slice(0, 3).map(r => ({
    id: `action-${r.id}`,
    type: "client_response",
    title: "Pending client response",
    description: `${r.lead_name || "A client"} is waiting for your reply.`,
    urgency: "high"
  }));

  // Build opportunities from pending requests
  const opportunities = pendingRequests.map(r => ({
    id: r.id,
    clientName: r.lead_name || "Confidential Client",
    matchScore: 90, // Placeholder as match score isn't stored in intro request directly
    category: r.category || "General",
    urgency: r.urgency_level || "Medium",
    location: "Remote",
    budgetRange: r.budget_preference || "Flexible",
    description: `A new opportunity in ${r.category || 'your area of expertise'}.`,
    postedAt: r.created_at
  }));

  // Build clients from active/accepted requests
  const clients = activeClients.map(r => ({
    id: r.id,
    clientName: r.lead_name || "Confidential Client",
    email: r.lead_email || "N/A",
    phone: r.lead_phone || "N/A",
    category: r.category || "General",
    status: r.status,
    acceptedAt: r.created_at, // Use created_at as fallback if updated_at is missing
  }));

  return {
    profile: expert,
    metrics,
    actionItems,
    opportunities,
    clients,
    analytics,
    reviews,
  };
}

async function updateExpertProfile(userId, updates) {
  const supabase = requireSupabase();

  const { data: link } = await supabase
    .from("expert_user_links")
    .select("expert_id")
    .eq("user_id", userId)
    .maybeSingle();

  const expertId = link?.expert_id || userId;

  // Fetch current expert record
  const { data: existingExpert } = await supabase
    .from("experts")
    .select("*")
    .eq("expert_id", expertId)
    .single();

  const metadata = existingExpert?.metadata || {};
  const currentPackages = Array.isArray(metadata.custom_packages) ? metadata.custom_packages : [];

  if (updates.custom_packages !== undefined) {
    const newPackages = updates.custom_packages.map((pkg) => {
      const existing = currentPackages.find((p) => p.id === pkg.id);
      return {
        id: pkg.id || `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: pkg.name || pkg.title || "Custom Package",
        description: pkg.description || "",
        priceUsd: Number(pkg.priceUsd || pkg.price || 150),
        deliveryWindow: pkg.deliveryWindow || pkg.delivery_time || "3-5 days",
        category: pkg.category || "General Support",
        status: existing && existing.name === pkg.name && existing.priceUsd === pkg.priceUsd ? existing.status : "pending",
        created_at: existing?.created_at || new Date().toISOString(),
      };
    });
    metadata.custom_packages = newPackages;
    delete updates.custom_packages;
  }

  if (updates.introduction_bio !== undefined) {
    metadata.introduction_bio = {
      text: updates.introduction_bio,
      status: "pending",
      submitted_at: new Date().toISOString(),
    };
    delete updates.introduction_bio;
  }

  updates.metadata = metadata;

  const { data, error } = await supabase
    .from("experts")
    .update(updates)
    .eq("expert_id", expertId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

async function reviewExpertPackage(expertId, packageId, status, rejectionReason = "") {
  const supabase = requireSupabase();

  const { data: expert, error: fetchError } = await supabase
    .from("experts")
    .select("*")
    .eq("expert_id", expertId)
    .single();

  if (fetchError || !expert) throw new Error("Expert not found.");

  const metadata = expert.metadata || {};
  const packages = Array.isArray(metadata.custom_packages) ? metadata.custom_packages : [];

  const updatedPackages = packages.map((pkg) => {
    if (pkg.id === packageId) {
      return {
        ...pkg,
        status,
        rejectionReason: status === "rejected" ? rejectionReason : "",
        reviewed_at: new Date().toISOString(),
      };
    }
    return pkg;
  });

  metadata.custom_packages = updatedPackages;

  const { data, error } = await supabase
    .from("experts")
    .update({ metadata })
    .eq("expert_id", expertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function reviewExpertIntroductionBio(expertId, status) {
  const supabase = requireSupabase();

  const { data: expert, error: fetchError } = await supabase
    .from("experts")
    .select("*")
    .eq("expert_id", expertId)
    .single();

  if (fetchError || !expert) throw new Error("Expert not found.");

  const metadata = expert.metadata || {};
  if (metadata.introduction_bio) {
    metadata.introduction_bio.status = status;
    metadata.introduction_bio.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("experts")
    .update({ metadata })
    .eq("expert_id", expertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateOpportunityStatus(userId, opportunityId, status) {
  const supabase = requireSupabase();

  const { data: link } = await supabase
    .from("expert_user_links")
    .select("expert_id")
    .eq("user_id", userId)
    .maybeSingle();

  const expertId = link?.expert_id || userId;

  const { data, error } = await supabase
    .from("introduction_requests")
    .update({ status })
    .eq("id", opportunityId)
    .eq("expert_id", expertId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

module.exports = {
  getDashboardOverview,
  updateExpertProfile,
  updateOpportunityStatus,
  reviewExpertPackage,
  reviewExpertIntroductionBio,
};
