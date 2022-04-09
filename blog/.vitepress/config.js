module.exports = {
  title: "Tom Bosmans",
  description: "My Personal Blog",
  lastUpdated: true,
  themeConfig: {
    repo: "TomBosmans/TomBosmans",
    base: "/",
    logo: "/logo.jpg",
    docsDir: "blog",
    docsBranch: "master",
    editLinks: true,
    editLinkText: "Edit this page on Github",
    lastUpdated: "Last Updated",
    nav: [
      { text: "Home", link: "/" },
      { text: "Blog", link: "/articles/" },
    ],
  },
  markdown: {
    lineNumbers: true,
  },
}
