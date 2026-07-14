import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchNotifications, markNotificationRead } from "../features/notifications/notificationSlice";
import type { RootState, AppDispatch } from "../app/store";
import { socket } from "../socket";
import axios from "../api/axios";
import Navbar from "../components/Navbar";
import { useDebounce } from "../hooks/useDebounce";

const Notifications = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((state: RootState) => state.auth.userId);
  const [page, setPage] = useState(1);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; title: string } | null>(null);

  const { notifications, loading, error, totalPages } = useSelector(
    (state: RootState) => state.notifications
  );

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (userId) {
      dispatch(fetchNotifications({ userId, page, search: debouncedSearch }));
    }
  }, [dispatch, page, userId, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
  socket.on("newNotification", (notification) => {
    toast.info(`New notification: ${notification.title}`);
    setPage(1);
    if (userId) {
      dispatch(fetchNotifications({ userId, page: 1, search: debouncedSearch }));
    }
  });

  return () => {
    socket.off("newNotification");
  };
}, [dispatch, userId, debouncedSearch]);

  useEffect(() => {
  const doJoin = () => {
    if (userId) {
      console.log("Joining room for userId:", userId);
      socket.emit("join", userId);
    }
  };

  // Join immediately if already connected
  if (socket.connected) {
    doJoin();
  }

  // Also join whenever the socket (re)connects
  socket.on("connect", doJoin);

  return () => {
    socket.off("connect", doJoin);
  };
}, [userId]);
  useEffect(() => {
    if (!loading && !hasLoadedOnce) setHasLoadedOnce(true);
  }, [loading, hasLoadedOnce]);

  const displayedNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "read") return notification.is_read;
    return !notification.is_read;
  });

  const handleMarkAsRead = async (id: number) => {
    const result = await dispatch(markNotificationRead(id));
    if (markNotificationRead.rejected.match(result)) {
      toast.error("Failed to mark as read.");
    } else {
      toast.success("Marked as read.");
    }
  };

  const requestDelete = (id: number, title: string) => {
    setConfirmTarget({ id, title });
  };

  const cancelDelete = () => {
    setConfirmTarget(null);
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    const { id, title } = confirmTarget;
    setConfirmTarget(null);

    try {
      await axios.delete(`/notifications/${id}`);
      if (userId) {
        dispatch(fetchNotifications({ userId, page, search: debouncedSearch }));
      }
      toast.success(`"${title}" deleted.`);
    } catch (err) {
      toast.error("Failed to delete notification.");
    }
  };

  return (
    <div className="notifications-container">
      <Navbar />

      <div>
        <input
          className="search-input"
          type="text"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-group">
          <button className="filter-btn" onClick={() => setFilter("all")}>All</button>
          <button className="filter-btn" onClick={() => setFilter("read")}>Read</button>
          <button className="filter-btn" onClick={() => setFilter("unread")}>Unread</button>
        </div>
      </div>

      {loading && !hasLoadedOnce && <h2>Loading Notifications...</h2>}
      {error && <h2>{error}</h2>}

      {(!loading || hasLoadedOnce) && !error && (
        <>
          <h2 className="page-title">
            Notifications ({displayedNotifications.length})
          </h2>

          {displayedNotifications.length === 0 ? (
            <p className="no-notifications">No notifications found.</p>
          ) : (
            displayedNotifications.map((notification) => (
              <div key={notification.id} className="notification-card">
                <h3 className="notification-title">{notification.title}</h3>
                <p className="notification-message">{notification.message}</p>
                <span className={notification.is_read ? "status-read" : "status-unread"}>
                  {notification.is_read ? "Read" : "Unread"}
                </span>
                <div className="notification-actions">
                  {!notification.is_read && (
                    <button
                      className="read-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => requestDelete(notification.id, notification.title)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(page - 1)} disabled={page === 1}>
              Previous
            </button>
            <span className="page-number">Page {page} of {totalPages}</span>
            <button
              className="page-btn"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {confirmTarget && (
        <div className="confirm-modal-overlay" onClick={cancelDelete}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-modal-title">Delete notification</h4>
            <p className="confirm-modal-message">
              Are you sure you want to delete <strong>{confirmTarget.title}</strong>?
              This action cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="confirm-modal-delete" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;