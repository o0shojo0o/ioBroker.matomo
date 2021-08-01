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
const object_definitions_1 = require("./lib/object_definitions");
let adapter;
let currentTimeout;
const createdObjs = [];
let isUnloaded = false;
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
        this.setStateChanged("info.connection", false, true);
        this.log.info("config serverAdresse: " + this.config.serverAdresse);
        this.log.info("config port: " + this.config.port);
        this.log.info("config apiKey: ******************");
        this.log.info("config pollingInterval: " + this.config.pollingInterval);
        intervalTick(this.config.serverAdresse, this.config.apiKey, this.config.pollingInterval * 1000);
    }
    onUnload(callback) {
        try {
            isUnloaded = true;
            clearTimeout(currentTimeout);
            callback();
        }
        catch (e) {
            callback();
        }
    }
}
async function intervalTick(matomoUrl, apiKey, pollingInterval) {
    if (currentTimeout) {
        clearTimeout(currentTimeout);
    }
    await worker(matomoUrl, apiKey);
    currentTimeout = setTimeout(async () => {
        intervalTick(matomoUrl, apiKey, pollingInterval);
    }, pollingInterval);
}
async function worker(matomoUrl, apiKey) {
    adapter.setStateChanged("info.connection", true, true);
    let sitesStats;
    try {
        sitesStats = (await getAllSitesStats(matomoUrl, apiKey));
    }
    catch (error) {
        throwWarn(error);
        return;
    }
    for (const key in sitesStats) {
        if (Object.prototype.hasOwnProperty.call(sitesStats, key)) {
            const stateBaseID = `sites.${sitesStats[key].idsite}`;
            // Channel erstellen
            await setObjectAndState("sites.site", stateBaseID, sitesStats[key].label, null);
            // SiteStats Propertys durchlaufen und in State schreiben
            for (const lKey in sitesStats[key]) {
                if (Object.prototype.hasOwnProperty.call(sitesStats[key], lKey)) {
                    // sites.site.{visits} | sites.{0}.{visits} | 0
                    setObjectAndState(`sites.site.${lKey}`, `${stateBaseID}.${lKey}`, null, sitesStats[key][lKey]);
                }
            }
            let liveCouter;
            try {
                liveCouter = (await getLiveCounters(matomoUrl, sitesStats[key].idsite, apiKey));
            }
            catch (error) {
                throwWarn(error);
                return;
            }
            // LiveCouter Propertys durchlaufen und in State schreiben
            for (const lKey in liveCouter) {
                if (Object.prototype.hasOwnProperty.call(liveCouter, lKey)) {
                    // sites.site.{visits} | sites.{0}.{visits} | 0
                    setObjectAndState(`sites.site.${lKey}`, `${stateBaseID}.${lKey}`, null, liveCouter[lKey]);
                }
            }
        }
    }
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
    const response = (await axios_1.default.get(apiUrl.href)).data;
    // Correct data types
    for (const key in response) {
        if (Object.prototype.hasOwnProperty.call(response, key)) {
            response[key].visits_evolution = parseFloat(String(response[key].visits_evolution).replace(",", "."));
            response[key].actions_evolution = parseFloat(String(response[key].actions_evolution).replace(",", "."));
            response[key].pageviews_evolution = parseFloat(String(response[key].pageviews_evolution).replace(",", "."));
            response[key].revenue_evolution = parseFloat(String(response[key].revenue_evolution).replace(",", "."));
        }
    }
    return response;
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
    const response = (await axios_1.default.get(apiUrl.href)).data[0];
    // Correct data types
    response.visits = parseInt(response.visits);
    response.actions = parseInt(response.actions);
    response.visitors = parseInt(response.visitors);
    response.visitsConverted = parseInt(response.visitsConverted);
    return response;
}
async function setObjectAndState(objectId, stateId, stateName, value) {
    const obj = object_definitions_1.objectDefinitions[objectId];
    if (!obj) {
        return;
    }
    // Check if is unload triggerted
    if (isUnloaded) {
        return;
    }
    if (stateName !== null) {
        obj.common.name = stateName;
    }
    // Check if the object must be created
    if (createdObjs.indexOf(stateId) === -1) {
        await adapter.setObjectNotExistsAsync(stateId, {
            type: obj.type,
            common: JSON.parse(JSON.stringify(obj.common)),
            native: JSON.parse(JSON.stringify(obj.native)),
        });
        // Remember created object for this runtime
        createdObjs.push(stateId);
    }
    if (value !== null) {
        adapter.setStateChangedAsync(stateId, {
            val: value,
            ack: true,
        });
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Matomo(options);
}
else {
    // otherwise start the instance directly
    (() => new Matomo())();
}
function throwWarn(error) {
    let errorMessage = error;
    if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
    }
    adapter.log.warn(`No connection to the server could be established. (${errorMessage})`);
    adapter.setStateChanged("info.connection", false, true);
}
//# sourceMappingURL=main.js.map