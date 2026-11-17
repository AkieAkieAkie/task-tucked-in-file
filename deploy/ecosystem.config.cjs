module.exports = {
  apps: [{
    name: "cercle",
    script: ".output/server/index.mjs",
    cwd: "/var/www/cercle",
    node_args: "--env-file=.env",
    env: { NODE_ENV: "production" },
  }],
};
