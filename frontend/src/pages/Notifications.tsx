import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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

  const { notifications, loading, error, totalPages } = useSelector(
    (state: RootState) => state.notifications
  );

  const debouncedSearch = useDebounce(search, 400);

  // main fetch — runs on page change or debounced search change
  useEffect(() => {
    if (userId) {
      dispatch(fetchNotifications({ userId, page, search: debouncedSearch }));
    }
  }, [dispatch, page, userId, debouncedSearch]);

  // reset to page 1 whenever the debounced search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // socket listener for realtime notifications
  useEffect(() => {
    socket.on("newNotification", (notification) => {
      alert(`New Notification: ${notification.title}`);
      if (userId) {
        dispatch(fetchNotifications({ userId, page, search: debouncedSearch }));
      }
    });

    return () => {
      socket.off("newNotification");
    };
  }, [dispatch, page, userId, debouncedSearch]);

  // only show "Loading..." on the very first load, not on every refetch
  useEffect(() => {
    if (!loading && !hasLoadedOnce) setHasLoadedOnce(true);
  }, [loading, hasLoadedOnce]);

  const displayedNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "read") return notification.is_read;
    return !notification.is_read;
  });

  const handleDelete = async (id: number) => {
    await axios.delete(`/notifications/${id}`);
    if (userId) {
      dispatch(fetchNotifications({ userId, page, search: debouncedSearch }));
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
                      onClick={() => dispatch(markNotificationRead(notification.id))}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => {
                      if (window.confirm("Delete notification?")) {
                        handleDelete(notification.id);
                      }
                    }}
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
    </div>
  );
};

export default Notifications;