export default {
  config: {
    locales: ['es'],
  },
  bootstrap(app) {
    app.registerHook('SSOProvider:willRegister', () => {});
  },
};
