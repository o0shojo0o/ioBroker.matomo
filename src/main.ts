/*
 * Created with @iobroker/create-adapter v1.33.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import axios from "axios";
import { SiteLiveCounter } from "./lib/site-live-counter";
import { SiteStats } from "./lib/site-states";

let adapter: Matomo;
let currentTimeout: NodeJS.Timeout;

class Matomo extends utils.Adapter {
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "matomo",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		adapter = this;
		this.setState("info.connection", false, true);
		this.log.info("config serverAdresse: " + this.config.serverAdresse);
		this.log.info("config port: " + this.config.port);
		this.log.info("config apiKey: **************");
		this.log.info("config pollingInterval: " + this.config.pollingInterval);

		worker(this.config.serverAdresse, this.config.apiKey);
		intervalTimer(this.config.serverAdresse, this.config.apiKey, this.config.pollingInterval * 1000);
	}
	private onUnload(callback: () => void): void {
		try {
			clearTimeout(currentTimeout);
			callback();
		} catch (e) {
			callback();
		}
	}
}

async function intervalTimer(matomoUrl: string, apiKey: string, pollingInterval: number): Promise<void> {
	if (currentTimeout) {
		clearTimeout(currentTimeout);
	}

	currentTimeout = setTimeout(async () => {
		worker(matomoUrl, apiKey);
		intervalTimer(matomoUrl, apiKey, pollingInterval);
	}, pollingInterval);
}

async function worker(matomoUrl: string, apiKey: string): Promise<void> {
	const siteStats = await getAllSitesStats(matomoUrl, apiKey);
	for (const key in siteStats) {
		if (Object.prototype.hasOwnProperty.call(siteStats, key)) {
			siteStats[key].visits_evolution = parseFloat(String(siteStats[key].visits_evolution).replace(",", "."));
			siteStats[key].actions_evolution = parseFloat(String(siteStats[key].actions_evolution).replace(",", "."));
			siteStats[key].pageviews_evolution = parseFloat(String(siteStats[key].pageviews_evolution).replace(",", "."));
			siteStats[key].revenue_evolution = parseFloat(String(siteStats[key].revenue_evolution).replace(",", "."));
			siteStats[key].siteLiveCounter = await getLiveCounters(matomoUrl, siteStats[key].idsite, apiKey);
			siteStats[key].siteLiveCounter.visits = parseInt(siteStats[key].siteLiveCounter.visits);
		}
	}
	adapter.log.debug(JSON.stringify(siteStats));
}

async function getAllSitesStats(matomoUrl: string, apiKey: string): Promise<Array<SiteStats>> {
	// Create API url with params
	const apiUrl = new URL("index.php", matomoUrl);
	apiUrl.searchParams.append("module", "API");
	apiUrl.searchParams.append("method", "MultiSites.getAll");
	apiUrl.searchParams.append("period", "day");
	apiUrl.searchParams.append("date", "today");
	apiUrl.searchParams.append("format", "JSON");
	apiUrl.searchParams.append("token_auth", apiKey);

	return (await axios.get(apiUrl.href)).data;
}

async function getLiveCounters(matomoUrl: string, idSite: number, apiKey: string): Promise<SiteLiveCounter> {
	// Create API url with params
	const apiUrl = new URL("index.php", matomoUrl);
	apiUrl.searchParams.append("module", "API");
	apiUrl.searchParams.append("method", "Live.getCounters");
	apiUrl.searchParams.append("idSite", idSite.toString());
	apiUrl.searchParams.append("lastMinutes", "3");
	apiUrl.searchParams.append("format", "JSON");
	apiUrl.searchParams.append("token_auth", apiKey);

	return (await axios.get(apiUrl.href)).data;
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Matomo(options);
} else {
	// otherwise start the instance directly
	(() => new Matomo())();
}
