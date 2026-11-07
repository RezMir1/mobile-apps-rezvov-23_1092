import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyDH9Uq-7RxSvcRGOkl_Ivw8-YilzQ5x8LA",
  authDomain: "college-firebase-lab-aa32b.firebaseapp.com",
  projectId: "college-firebase-lab-aa32b",
  storageBucket: "college-firebase-lab-aa32b.firebasestorage.app",
  messagingSenderId: "387104161539",
  appId: "1:387104161539:web:34f54062c8efc1fce27336",
};
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  linkWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const githubProvider = new GithubAuthProvider();
const googleProvider = new GoogleAuthProvider();
const googleLoginBtn = document.getElementById("googleLoginBtn");
const githubLoginBtn = document.getElementById("githubLoginBtn");
const userPanel = document.getElementById("userPanel");
const loginPanel = document.getElementById("loginPanel");
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("Пользователь вышел");
  } catch (error) {
    console.error("Ошибка выхода:", error.code);
  }
});
onAuthStateChanged(auth, (user) => {
  if (user) {
    userName.textContent = user.displayName || user.email || "Пользователь";
    loginPanel.hidden = true;
    userPanel.hidden = false;
  } else {
    userName.textContent = "";
    loginPanel.hidden = false;
    userPanel.hidden = true;
  }
});
googleLoginBtn.addEventListener("click", () => signIn(googleProvider));
githubLoginBtn.addEventListener("click", () => signIn(githubProvider));
document
  .getElementById("confirmLoginBtn")
  .addEventListener("click", confirmExistingAccount);
let pendingCredential = null;
let pendingEmail = null;
let pendingProvider = null;
async function signIn(provider) {
  try {
    const result = await signInWithPopup(auth, provider);

    console.log("Успешный вход:", result.user.email);
    console.log("UID:", result.user.uid);
  } catch (error) {
    if (error.code === "auth/account-exists-with-different-credential") {
      await handleAccountConflict(error, provider);
    } else {
      console.error("Ошибка входа:", error.code);
    }
  }
}
async function handleAccountConflict(error, provider) {
  const credential =
    provider.providerId === "github.com"
      ? GithubAuthProvider.credentialFromError(error)
      : GoogleAuthProvider.credentialFromError(error);

  if (!credential) {
    console.error("Не удалось получить данные провайдера");
    return;
  }

  console.log("Конфликт аккаунтов!");
  console.log("Провайдер:", provider.providerId);
  console.log("Email:", error.customData?.email);
  console.log("Данные для привязки получены:", !!credential);
  const existingProvider =
    provider.providerId === "github.com" ? googleProvider : githubProvider;

  pendingCredential = credential;
  pendingEmail = error.customData?.email;

  pendingProvider =
    provider.providerId === "github.com" ? googleProvider : githubProvider;

  document.getElementById("confirmLoginBtn").hidden = false;
}
const db = getFirestore(app);
async function loadInFirebase() {
  const usersList = document.getElementById("firebaseUsers");

  const snapshot = await getDocs(collection(db, "users"));

  snapshot.forEach((doc) => {
    console.log(doc.id, doc.data());
    const li = document.createElement("li");
    li.textContent = doc.data().username;
    usersList.appendChild(li);
  });
}
async function confirmExistingAccount() {
  if (!pendingCredential || !pendingProvider || !pendingEmail) return;

  try {
    const result = await signInWithPopup(auth, pendingProvider);

    if (result.user.email?.toLowerCase() !== pendingEmail.toLowerCase()) {
      console.error("Выбран другой аккаунт!");
      return;
    }

    const linked = await linkWithCredential(result.user, pendingCredential);

    console.log("Аккаунты успешно связаны!");
    console.log("UID:", linked.user.uid);
    console.log("Провайдеры:", linked.user.providerData);

    document.getElementById("confirmLoginBtn").hidden = true;
  } catch (error) {
    console.error("Ошибка подтверждения:", error.code);
  }
}
loadInFirebase();
