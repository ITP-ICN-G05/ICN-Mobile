# ICN-Mobile

This is the **mobile frontend** for the ICN project, built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/).  
It connects to the Spring Boot backend via REST APIs.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- npm or yarn
- Expo Go app (install on your iOS/Android phone)
- Git

### Installation
```bash
# clone repo
git clone git@github.com:ITP-ICN-G05/ICN-Mobile.git
cd ICN-Mobile

# install dependencies
npm install
```

### Running on Device

```bash
npm start
```

* Scan the QR code with **Expo Go** (phone and Mac must be on the same Wi-Fi).
* The app will load instantly on your phone.

## 🔌 API Configuration
* API helper is in `constants/api.ts`.
* Default base URL:
   * **Android emulator**: `http://10.0.2.2:8080`
   * **iOS simulator/physical device**: `http://<your-mac-ip>:8080`
* To override, run with:

```bash
EXPO_PUBLIC_API_URL=http://<backend-host>:8080 npm start
```

## 📜 Project Structure
* `app/` – Screens and routes (Expo Router)
* `components/` – Reusable UI components
* `constants/` – Config and API helpers
* `assets/` – Images, fonts
* `hooks/` – Custom React hooks

## 🤝 Contributing
1. Create a feature branch: `git checkout -b feature/xyz`
2. Commit changes: `git commit -m "feat: add xyz"`
3. Push branch: `git push origin feature/xyz`
4. Open a Pull Request

## 🛠️ Tools
* Expo Router
* React Native
* Axios
* ESLint + Prettier