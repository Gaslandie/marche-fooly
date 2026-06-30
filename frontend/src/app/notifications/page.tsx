import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import NotificationActions from "@/components/notifications/NotificationActions";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications, type NotificationItem } from "@/lib/notifications";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Notifications internes de votre compte Marché Fooly.",
};

function notificationIcon(type: string) {
  if (type.includes("order")) return "bi bi-receipt";
  if (type.includes("seller")) return "bi bi-shop";
  if (type.includes("admin")) return "bi bi-shield-check";
  return "bi bi-bell";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function NotificationCard({ item }: { item: NotificationItem }) {
  const unread = !item.readAt;
  const content = (
    <>
      <div
        className={`d-inline-flex align-items-center justify-content-center rounded-circle ${
          unread ? "bg-warning text-dark" : "bg-light text-secondary"
        }`}
        style={{ width: 44, height: 44, flex: "0 0 44px" }}
      >
        <i className={notificationIcon(item.type)} aria-hidden="true"></i>
      </div>
      <div className="flex-grow-1">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
          <h2 className="h6 fw-bold mb-0">{item.title}</h2>
          {unread && <span className="badge text-bg-warning">Nouveau</span>}
        </div>
        <p className="text-secondary mb-2">{item.message}</p>
        <p className="small text-secondary mb-0">{formatDate(item.createdAt)}</p>
      </div>
    </>
  );

  return (
    <article className="border rounded-3 bg-white p-3 shadow-sm">
      <div className="d-flex gap-3 align-items-start">
        {item.href ? (
          <Link href={item.href} className="d-flex gap-3 flex-grow-1">
            {content}
          </Link>
        ) : (
          <div className="d-flex gap-3 flex-grow-1">{content}</div>
        )}
        {unread && <NotificationActions mode="single" id={item.id} />}
      </div>
    </article>
  );
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/mon-compte?retour=/notifications");

  const result = await getNotifications({ limit: 30 });
  const notifications = result?.items ?? [];
  const unreadCount = result?.unreadCount ?? 0;

  return (
    <>
      <section className="py-4 py-lg-5" style={{ background: "var(--mf-light)" }}>
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
            <div>
              <span className="badge text-bg-warning mb-3">Compte</span>
              <h1 className="fw-black mb-2" style={{ fontWeight: 900 }}>
                Notifications
              </h1>
              <p className="text-secondary mb-0">
                Suivez les commandes, demandes vendeur et messages importants.
              </p>
            </div>
            <NotificationActions
              mode="all"
              disabled={unreadCount === 0 || notifications.length === 0}
            />
          </div>
        </div>
      </section>

      <section className="py-4 py-lg-5">
        <div className="container">
          {!result ? (
            <div className="alert alert-warning" role="alert">
              Impossible de charger vos notifications pour le moment.
            </div>
          ) : notifications.length === 0 ? (
            <div className="border rounded-3 bg-white p-4 text-center">
              <i className="bi bi-bell fs-1 text-secondary" aria-hidden="true"></i>
              <h2 className="h5 fw-bold mt-3">Aucune notification</h2>
              <p className="text-secondary mb-0">
                Vos prochaines activités importantes apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="d-grid gap-3">
              {notifications.map((item) => (
                <NotificationCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

