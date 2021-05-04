type MyObjects = Record<string, MyObjectsDefinitions>;

interface MyObjectsDefinitions extends Omit<ioBroker.BaseObject, "_id"> {
	common: MyStateCommon;
}

interface MyStateCommon extends Partial<ioBroker.StateCommon> {
	name: string;
}

const objectDefinitions: MyObjects = {
	"sites.site": {
		type: "channel",
		common: {
			name: "Site",
		},
		native: {},
	},
	"sites.site.label": {
		type: "state",
		common: {
			name: "Site label",
			role: "text",
			type: "string",
			write: false,
			read: true,
		},
		native: {},
	},
	"sites.site.main_url": {
		type: "state",
		common: {
			name: "Site main url",
			role: "url.blank",
			type: "string",
			write: false,
			read: true,
		},
		native: {},
	},
	"sites.site.visits": {
		type: "state",
		common: {
			name: "Visits last 3 minutes",
			role: "value",
			type: "number",
			write: false,
			read: true,
		},
		native: {},
	},
	"sites.site.actions": {
		type: "state",
		common: {
			name: "Actions last 3 minutes",
			role: "value",
			type: "number",
			write: false,
			read: true,
		},
		native: {},
	},
	"sites.site.visitors": {
		type: "state",
		common: {
			name: "Visitors last 3 minutes",
			role: "value",
			type: "number",
			write: false,
			read: true,
		},
		native: {},
	},
	"sites.site.nb_visits": {
		type: "state",
		common: {
			name: "Number of visits today",
			role: "value",
			type: "number",
			write: false,
			read: true,
		},
		native: {},
	},
	"sites.site.nb_actions": {
		type: "state",
		common: {
			name: "Number of actions today",
			role: "value",
			type: "number",
			write: false,
			read: true,
		},
		native: {},
	},
	"sites.site.nb_pageviews": {
		type: "state",
		common: {
			name: "Number of pageviews today",
			role: "value",
			type: "number",
			write: false,
			read: true,
		},
		native: {},
	},
};

export { objectDefinitions, MyObjects, MyObjectsDefinitions, MyStateCommon };
