const { execSync } = require("node:child_process");

const scopes = [
  { name: "auth:        authentication, authorization", value: "auth" },
  { name: "user:        user module", value: "user" },
  { name: "config:      config files, env, server configs", value: "config" },
  { name: "db:          database connection, models, migrations", value: "db" },
  { name: "api:         controllers, routes, validation", value: "api" },
  { name: "middleware:  express middleware", value: "middleware" },
  { name: "service:     services / business logic", value: "service" },
  { name: "util:        utils/helpers", value: "util" },
  { name: "repo:        repository meta tasks", value: "repo" },
  { name: "release:     release related commits", value: "release" },
];

let branch = "";
try {
  branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
} catch {}

module.exports = {
  extends: ["@commitlint/config-conventional"],
  prompt: {
    aiDiffIgnore: ["package-lock.json"],
    aiNumber: 2,
    alias: {
      b: "chore(repo): bump dependencies",
      f: "docs(repo): fix documentation",
    },
    allowBreakingChanges: ["feat", "fix"],
    allowCustomIssuePrefix: true,
    allowCustomScopes: true,
    breaklineChar: "|",
    breaklineNumber: 100,
    defaultIssues: `#${branch}`,
    emojiAlign: "right",
    enableMultipleScopes: true,
    scopes,
    types: [
      { emoji: "✨", name: "feat: ✨ A new feature", value: "feat" },
      { emoji: "🐛", name: "fix: 🐛 A bug fix", value: "fix" },
      { emoji: "📝", name: "docs: 📝 Documentation changes", value: "docs" },
      {
        emoji: "🎨",
        name: "style: 🎨 Formatting only code changes",
        value: "style",
      },
      { emoji: "♻️", name: "refactor: ♻️ Refactoring", value: "refactor" },
      {
        emoji: "⚡️",
        name: "perf: ⚡️ Performance improvements",
        value: "perf",
      },
      { emoji: "✅", name: "test: ✅ Adding or fixing tests", value: "test" },
      { emoji: "📦️", name: "build: 📦️ Build system or deps", value: "build" },
      { emoji: "🎡", name: "ci: 🎡 CI-related changes", value: "ci" },
      {
        emoji: "🔨",
        name: "chore: 🔨 Other changes that don’t affect src",
        value: "chore",
      },
      {
        emoji: "⏪️",
        name: "revert: ⏪️ Revert previous commit",
        value: "revert",
      },
    ],
    upperCaseSubject: false,
    useAI: false,
    useEmoji: true,
  },
};
