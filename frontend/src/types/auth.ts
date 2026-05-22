/**
 * Types: auth
 *
 * Rôle du fichier :
 *   Décrit les formes de données échangées pour l'authentification :
 *     - `AuthUser` : utilisateur public renvoyé par le backend
 *       (backend/src/controllers/authController.js -> toPublicUser).
 *     - `RegisterPayload` / `LoginPayload` : corps des formulaires.
 *     - `AuthResponse` : forme renvoyée par les Route Handlers Next
 *       internes (app/api/auth/*) au navigateur.
 *
 * Où il est utilisé :
 *   - src/lib/auth.ts (helpers serveur)
 *   - app/api/auth/* (Route Handlers)
 *   - plus tard : AuthTabs, mon-compte, AccountSidebar (blocs suivants)
 *
 * Règle de sécurité :
 *   Aucune de ces formes ne contient le JWT. Le token n'est JAMAIS
 *   exposé au navigateur : il vit uniquement dans un cookie httpOnly,
 *   posé et lu côté serveur.
 *
 * Note pour GitHub Copilot :
 *   - Source de vérité backend : toPublicUser() expose exactement ces
 *     champs ; ne pas y ajouter passwordHash ni token.
 */

/** Adresse postale optionnelle d'un utilisateur. */
export type AuthAddress = {
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
};

/** Rôles applicatifs (forcés côté serveur ; l'inscription publique = customer). */
export type AuthRole = "customer" | "seller" | "admin";

/** Utilisateur public, tel que renvoyé par le backend (jamais le token). */
export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AuthRole;
  status: string;
  avatarUrl: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  address: AuthAddress | null;
  createdAt: string;
};

/** Corps attendu par POST /api/auth/register. */
export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

/** Corps attendu par POST /api/auth/login. */
export type LoginPayload = {
  email: string;
  password: string;
};

/**
 * Réponse renvoyée au navigateur par les Route Handlers internes
 * (app/api/auth/*). Volontairement SANS token.
 */
export type AuthResponse = {
  success: boolean;
  message: string;
  user: AuthUser | null;
};
