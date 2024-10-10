class Auth {
  static isNotAuthenticated(req, res, next) {
    if (!(req.session && req.session.login)) {
      return next();
    }

    return res.status(404).render("error", {
      code: 404,
      message: "Halaman tidak ditemukan",
    });
  }

  static isAuthenticated(req, res, next, goto) {
    if (req.session && req.session.login) {
      return next();
    }
    if (goto == "login") {
      return res.render("login", {
        header: "Panel Kontrol",
        label: "PASSWORD",
        admin: true,
      });
    }

    return res.status(404).render("error", {
      code: 404,
      message: "Halaman tidak ditemukan",
    });
  }
}

module.exports = Auth;
