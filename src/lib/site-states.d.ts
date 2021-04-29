import { SiteLiveCounter } from "./lib/site-live-counter";

export interface SiteStats {
	label: string;
	// Number of Visits (30 min of inactivity considered a new visit)
	nb_visits: number;
	// Number of actions (page views, outlinks and downloads)
	nb_actions: number;
	//
	nb_pageviews: number;
	// Total revenue of goal conversions
	revenue: number;
	//
	visits_evolution: number;
	//
	actions_evolution: number;
	//
	pageviews_evolution: number;
	//
	revenue_evolution: number;
	//
	idsite: number;
	//
	main_url: string;
	//
	siteLiveCounter: SiteLiveCounter;
}
