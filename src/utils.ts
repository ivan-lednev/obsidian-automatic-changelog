import { moment, stringifyYaml } from "obsidian";

function createDailyDiffConfig() {
	return {
		dates: {
			from: getDefaultFrom(),
			to: getDefaultTo(),
		},
	};
}

export function getDefaultFrom() {
	return moment().subtract(1, "day").format("YYYY-MM-DD");
}

export function getDefaultTo() {
	return moment().format("YYYY-MM-DD");
}

export function createDailyDiffCodeBlock() {
	const yaml = stringifyYaml(createDailyDiffConfig()).trimEnd();
	return `\`\`\`show-diff\n${yaml}\n\`\`\``;
}

function getDateRange(from: string, to: string) {
	return `HEAD@{${from}}..HEAD@{${to}}`;
}

function getDefaultDateRange() {
	return getDateRange(getDefaultFrom(), getDefaultTo());
}

function getCommitRange(from: string, to: string) {
	return `${from}..${to}`;
}

function excludePath(string: string) {
	return `:(exclude)${string}`;
}

export function createRangeArg(config: any) {
	if (!config) {
		return getDefaultDateRange();
	}

	const { commits, dates } = config;

	if (commits) {
		const { from, to } = commits;
		if (!from) {
			throw new Error("Commits must have a `from` and `to` property");
		}

		return getCommitRange(from, to);
	}

	if (dates) {
		const { from, to = getDefaultTo() } = dates;
		if (!from) {
			throw new Error("Dates must have a `from` property");
		}

		return getDateRange(from, to);
	}

	return getDefaultDateRange();
}

export function getExcludedPaths(config: any) {
	if (!config) {
		return excludePath(".obsidian");
	}

	const { exclude } = config;

	if (Array.isArray(exclude)) {
		return exclude.map((path: string) => excludePath(path)).join(" ");
	}

	return excludePath(exclude);
}
