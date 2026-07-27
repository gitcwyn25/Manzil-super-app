// Tailwind was removed: it had no @tailwind directives and generated nothing.
// Autoprefixer stays — globals.css is hand-written and still needs vendor prefixes.
module.exports = {
  plugins: {
    autoprefixer: {},
  },
};
