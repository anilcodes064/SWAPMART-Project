# SwapMart 🔄

> **Trade what you have for what you want — no money involved.**

SwapMart is a fully client-side trade marketplace where users can list items, browse listings, and send trade proposals directly to each other. No backend, no payments, no accounts stored anywhere except your own browser.

---

## 📁 Project Structure

```
swapmart/
├── index.html      # HTML structure & page layouts
├── style.css       # All styling, variables, responsive design
├── script.js          # All JavaScript logic & localStorage data layer
└── README.md       # You're reading it
```

---

## 🚀 Getting Started

No build tools, no npm, no server needed.

1. Download or clone all files into the same folder
2. Open `index.html` in any modern browser
3. Sign up and start trading

> ⚠️ All three files (`index.html`, `style.css`, `app.js`) **must be in the same directory** for the app to work correctly.

---

## ✨ Features

### 🔐 Authentication
- Sign up with a username and password
- Log in / log out with session persistence via `localStorage`
- Sessions survive page refresh

### 📦 List an Item
- Add item name, condition (New / Used), and category
- Write a description and specify what you want in exchange
- Paste an image URL for a preview
- Categories: Electronics, Clothes, Books, Other

### 🔍 Browse Items
- Card-based grid layout showing all items listed by other users
- Live search bar filtering by name, description, or desired exchange
- Category filter buttons (All, Electronics, Clothes, Books, Other)

### 🤝 Trade Requests
- Click **Propose Trade** on any item card
- Select one of your own items to offer in exchange
- Add an optional message with your proposal
- Duplicate requests are automatically blocked

### 📊 Dashboard
- View all items you've listed, with the option to remove them
- See all received trade requests — accept or reject them
- See all sent trade requests and their current status
- Mark accepted trades as **Completed**

### ⭐ Trust Score
- Both users gain +1 Trust Score when a trade is accepted
- Score is displayed in the nav bar and dashboard
- Encourages good-faith trading behaviour

---

## 🗂️ Data Storage

Everything is stored in `localStorage` under these keys:

| Key | Contents |
|---|---|
| `sm_session` | Currently logged-in username |
| `sm_users` | Object of `{ username: { password, trustScore } }` |
| `sm_items` | Array of all listed items |
| `sm_trades` | Array of all trade requests and their statuses |

> **Note:** Data is stored per-browser. Clearing browser storage will reset all data. To simulate two different users trading, open the app in a normal window and an incognito window simultaneously.

---

## 🔄 Trade Status Flow

```
Sent → Pending → Accepted → Completed
                ↘ Rejected
```

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | localStorage |
| Fonts | Google Fonts — Syne + DM Sans |

No frameworks. No dependencies. No internet required after initial font load.

---

## 📱 Responsive Design

SwapMart is mobile-friendly out of the box:

- Navigation collapses gracefully on small screens
- Item grid reflows to fewer columns on narrow viewports
- Dashboard panels stack vertically on mobile
- Forms switch to single-column layout on small screens

---

## 🔮 Possible Enhancements

These features are beyond the MVP scope but are straightforward to add:

- **Chat system** — basic per-trade messaging thread stored in localStorage
- **Item editing** — let users update listings without deleting and re-adding
- **Trade history** — completed trades log on the dashboard
- **Notifications badge** — show unread request count on the Dashboard nav button
- **Image upload** — use FileReader API to store base64 images locally instead of URLs
- **Backend integration** — swap localStorage for a REST API + database for multi-device support

---

## ⚙️ Browser Compatibility

Works in all modern browsers that support ES6+ and localStorage:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 80+

---

## 📄 License

This project is open source and free to use for personal or educational purposes.

---

*Built with zero money, just like the trades on SwapMart.* ✌️