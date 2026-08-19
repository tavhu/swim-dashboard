export default [
  // {
  //   isTitle: false,
  //   name: "Components",
  //   key: "component",
  //   icon: "box",
  //   submenu: [
  //     {
  //       isTitle: false,
  //       name: "Accordion",
  //       url: "/components/accordion",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Button",
  //       url: "/components/button",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Modal",
  //       url: "/components/modal",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Offcanvas",
  //       url: "/components/offcanvas",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Dropdown",
  //       url: "/components/dropdown",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Dialog",
  //       url: "/components/dialog",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Toast",
  //       url: "/components/toast",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Icons",
  //       url: "/components/icon",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Skeleton",
  //       url: "/components/skeleton",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Tabs",
  //       url: "/components/tabs",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //   ],
  // },
  // {
  //   isTitle: false,
  //   name: "Inbox",
  //   url: "/inbox",
  //   icon: "inbox",
  //   submenu: [],
  // },
  // {
  //   isTitle: true,
  //   name: "Form & Tables",
  //   url: "",
  //   icon: "",
  //   submenu: [],
  // },
  // {
  //   isTitle: false,
  //   name: "Forms",
  //   key: "forms",
  //   icon: "sidebar",
  //   submenu: [
  //     {
  //       isTitle: false,
  //       name: "General",
  //       url: "/form/general",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //   ],
  // },
  // {
  //   isTitle: false,
  //   name: "Table",
  //   key: "table",
  //   icon: "table",
  //   submenu: [
  //     {
  //       isTitle: false,
  //       name: "Datatable Clientside",
  //       url: "/table/simple",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Datatable Serverside",
  //       url: "/table/datatable",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //   ],
  // },
  // {
  //   isTitle: true,
  //   name: "Pages",
  //   url: "",
  //   icon: "",
  //   submenu: [],
  // },
  // {
  //   isTitle: false,
  //   name: "Page",
  //   url: "",
  //   icon: "sidebar",
  //   submenu: [
  //     {
  //       isTitle: false,
  //       name: "Login",
  //       url: "/login",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Register",
  //       url: "/register",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //     {
  //       isTitle: false,
  //       name: "Profile",
  //       url: "/profile",
  //       icon: "chevron-right",
  //       submenu: [],
  //     },
  //   ],
  // },
  {
    isTitle: false,
    name: "Settings",
    i18nKey: "menu.settings",
    url: "",
    icon: "settings",
    submenu: [
      {
        isTitle: false,
        name: "សេវា",
        i18nKey: "menu.services",
        url: "",
        icon: "message-square",
        submenu: [
          {
            isTitle: false,
            name: "បញ្ចី",
            i18nKey: "menu.list",
            url: "/service",
            icon: "",
            submenu: [],
          },
          {
            isTitle: false,
            name: "បង្កើត",
            i18nKey: "menu.create",
            url: "/service/register",
            icon: "",
            submenu: [],
          },
        ],
      },
      // The reference list behind the ប្រភេទអតិថិជន dropdown on ទម្រង់ទី២, kept
      // next to សេវា because they are the same kind of thing: catalogues an
      // admin maintains so the case forms have something to offer.
      {
        isTitle: false,
        name: "ប្រភេទអតិថិជន",
        i18nKey: "menu.clientTypes",
        url: "",
        icon: "tag",
        submenu: [
          {
            isTitle: false,
            name: "បញ្ចី",
            i18nKey: "menu.list",
            url: "/client-type",
            icon: "",
            submenu: [],
          },
          {
            isTitle: false,
            name: "បង្កើត",
            i18nKey: "menu.create",
            url: "/client-type/register",
            icon: "",
            submenu: [],
          },
        ],
      },
      {
        isTitle: false,
        name: "ស្ថាប័ន",
        i18nKey: "menu.organisations",
        url: "",
        icon: "home",
        submenu: [
          {
            isTitle: false,
            name: "ចុះឈ្មោះ",
            i18nKey: "menu.register",
            url: "/organisation",
            icon: "",
            submenu: [],
          },
        ],
      },
      {
        isTitle: false,
        name: "មណ្ឌល",
        i18nKey: "menu.centres",
        url: "",
        icon: "home",
        submenu: [
          {
            isTitle: false,
            name: "បញ្ជី",
            i18nKey: "menu.list",
            url: "/center/list",
            icon: "",
            submenu: [],
          },
          {
            isTitle: false,
            name: "ចុះឈ្មោះ",
            i18nKey: "menu.register",
            url: "/center",
            icon: "",
            submenu: [],
          },
        ],
      },
      {
        isTitle: false,
        name: "គណនី",
        i18nKey: "menu.accounts",
        url: "",
        icon: "lock",
        submenu: [
          {
            isTitle: false,
            name: "បញ្ជី",
            i18nKey: "menu.list",
            url: "/register/account",
            icon: "",
            submenu: [],
          },
          {
            isTitle: false,
            name: "ចុះឈ្មោះ",
            i18nKey: "menu.register",
            url: "/register",
            icon: "",
            submenu: [],
          },
          {
            isTitle: false,
            name: "តួនាទី និងការអនុញ្ញាត",
            i18nKey: "menu.rolesPermissions",
            url: "/role",
            icon: "",
            submenu: [],
          },
        ],
      },
      {
        isTitle: false,
        name: "ប្រអប់សារ",
        i18nKey: "menu.inbox",
        url: "",
        icon: "mail",
        submenu: [
          {
            isTitle: false,
            name: "បញ្ជី",
            i18nKey: "menu.list",
            url: "/contact/list",
            icon: "",
            submenu: [],
          },
        ],
      },
      // ការបញ្ជូន lives under ការកំណត់ at the ministry's request. The list is the
      // way in; a referral itself is raised from a client's own file, which is
      // the only place the client is known.
      {
        isTitle: false,
        name: "ការបញ្ជូន",
        i18nKey: "menu.referral",
        url: "",
        icon: "send",
        submenu: [
          {
            isTitle: false,
            name: "បញ្ជីការបញ្ជូន",
            i18nKey: "menu.referralList",
            url: "/referral",
            icon: "",
            submenu: [],
          },
          {
            isTitle: false,
            name: "ប្រភេទសេវាបញ្ជូន",
            i18nKey: "menu.referralTypes",
            url: "/referral-type",
            icon: "",
            submenu: [],
          },
        ],
      },
      // Reading មតិយោបល់ is administration, so it stays in ការកំណត់. Writing one
      // moved to the main menu — it is open to everyone, and Settings is not
      // where an ordinary user looks. Flat rather than a group: with writing
      // gone there is one entry left, and a group of one is just an extra click.
      {
        isTitle: false,
        name: "បញ្ជីមតិយោបល់",
        i18nKey: "menu.feedbackList",
        url: "/feedback/list",
        icon: "message-square",
        submenu: [],
      },
    ],
  },
  // Below ការកំណត់ rather than inside it. Everyone may read អំពីយើង, and a page
  // for everyone does not belong in the group that holds the administration —
  // sitting outside it also means the entry stays visible to a role that cannot
  // open anything under Settings at all.
  {
    isTitle: false,
    name: "អំពីយើង",
    i18nKey: "menu.about",
    url: "/about",
    icon: "info",
    submenu: [],
  },
];
