"use strict";
/*
 * Created with @iobroker/create-adapter v1.33.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = __importStar(require("@iobroker/adapter-core"));
const axios_1 = __importDefault(require("axios"));
let adapter;
let currentTimeout;
class Matomo extends utils.Adapter {
    constructor(options = {}) {
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
    async onReady() {
        adapter = this;
        this.setState("info.connection", false, true);
        this.log.info("config serverAdresse: " + this.config.serverAdresse);
        this.log.info("config port: " + this.config.port);
        this.log.info("config apiKey: **************");
        this.log.info("config pollingInterval: " + this.config.pollingInterval);
        worker(this.config.serverAdresse, this.config.apiKey);
        intervalTimer(this.config.serverAdresse, this.config.apiKey, this.config.pollingInterval * 1000);
    }
    onUnload(callback) {
        try {
            clearTimeout(currentTimeout);
            callback();
        }
        catch (e) {
            callback();
        }
    }
}
async function intervalTimer(matomoUrl, apiKey, pollingInterval) {
    if (currentTimeout) {
        clearTimeout(currentTimeout);
    }
    currentTimeout = setTimeout(async () => {
        worker(matomoUrl, apiKey);
        intervalTimer(matomoUrl, apiKey, pollingInterval);
    }, pollingInterval);
}
async function worker(matomoUrl, apiKey) {
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
async function getAllSitesStats(matomoUrl, apiKey) {
    // Create API url with params
    const apiUrl = new URL("index.php", matomoUrl);
    apiUrl.searchParams.append("module", "API");
    apiUrl.searchParams.append("method", "MultiSites.getAll");
    apiUrl.searchParams.append("period", "day");
    apiUrl.searchParams.append("date", "today");
    apiUrl.searchParams.append("format", "JSON");
    apiUrl.searchParams.append("token_auth", apiKey);
    return (await axios_1.default.get(apiUrl.href)).data;
}
async function getLiveCounters(matomoUrl, idSite, apiKey) {
    // Create API url with params
    const apiUrl = new URL("index.php", matomoUrl);
    apiUrl.searchParams.append("module", "API");
    apiUrl.searchParams.append("method", "Live.getCounters");
    apiUrl.searchParams.append("idSite", idSite.toString());
    apiUrl.searchParams.append("lastMinutes", "3");
    apiUrl.searchParams.append("format", "JSON");
    apiUrl.searchParams.append("token_auth", apiKey);
    return (await axios_1.default.get(apiUrl.href)).data;
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Matomo(options);
}
else {
    // otherwise start the instance directly
    (() => new Matomo())();
}
