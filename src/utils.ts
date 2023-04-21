import { moment, stringifyYaml } from "obsidian";
import { isNotUndefined, isString } from "typed-assert";
import { simpleGit } from "simple-git";

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

export function createRevisionRange(commits?: any, dates?: any) {
	if (commits) {
		const { from, to } = commits;
		isString(from, "Commits must have a `from` string property");
		isString(to, "Commits must have a `to` string property");

		return getCommitRange(from, to);
	}

	if (dates) {
		const { from, to = getDefaultTo() } = dates;
		isNotUndefined(from, "Dates must have a `from` property");

		return getDateRange(from, to);
	}

	return getDefaultDateRange();
}

export function createExcludedPaths(exclude: any) {
	if (Array.isArray(exclude)) {
		return exclude.map((path: string) => excludePath(path)).join(" ");
	}

	return excludePath(exclude);
}

export function gitDiff(config: any) {
	const revisionRange = createRevisionRange(config.commits, config.dates);
	const excludedPaths = createExcludedPaths(config.exclude || ".obsidian");

	const args = [revisionRange, "--", excludedPaths];

	return simpleGit(config.path).diff(args);
}

