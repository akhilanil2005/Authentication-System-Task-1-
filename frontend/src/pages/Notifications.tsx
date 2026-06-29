import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markNotificationRead} from "../features/notifications/notificationSlice";
import type{ RootState, AppDispatch } from "../app/store";
import {socket} from "../socket";
import axios from "../api/axios";

const Notifications = () => {
const [filter, setFilter] = useState("all");
const [search, setSearch] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector(
  (state: RootState) => state.auth.userId
);
    console.log("Redux UserId:", userId);
  const [page, setPage]= useState(1);

  const { notifications, loading, error } = useSelector(
    (state: RootState) => state.notifications
  );

  useEffect(() => {
  socket.on("newNotification", (notification) => {
    console.log("New Notification", notification);

    alert(`New Notification: ${notification.title}`);

    dispatch(fetchNotifications({ userId: userId || 61, page }));
  });

  return () => {
    socket.off("newNotification");
  };
}, [dispatch, page, userId]);

  useEffect(() => {
    dispatch(fetchNotifications({ userId: userId || 61, page,}));
  }, [dispatch, page, userId]);

  if (loading)
  return (
    <div>
      <h2>Loading Notifications...</h2>
    </div>
  );

  if (error) return <h2>{error}</h2>;
console.log(notifications);
const filteredNotifications = notifications.filter((notification) => {
  const matchesFilter =
    filter === "all"
      ? true
      : filter === "read"
      ? notification.is_read
      : !notification.is_read;

  const matchesSearch =
    notification.title
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    notification.message
      .toLowerCase()
      .includes(search.toLowerCase());

  return matchesFilter && matchesSearch;
});
const handleDelete = async (id: number) => {
  await axios.delete(`/notifications/${id}`);

  dispatch(fetchNotifications({ userId: userId || 61, page }));
};
  return (
    <div>
        <div>
            <input
  type="text"
  placeholder="Search notifications..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
  <button onClick={() => setFilter("all")}>All</button>
  <button onClick={() => setFilter("read")}>Read</button>
  <button onClick={() => setFilter("unread")}>Unread</button>
</div>
      <h2>Notifications ({filteredNotifications.length})</h2>
        {filteredNotifications.length === 0 ? (
  <p>No notifications found.</p>
) : (
      filteredNotifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            border: "1px solid gray",
            padding: "10px",
            margin: "10px",
          }}
        >
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <small>
            {notification.is_read ? "Read" : "Unread"}
          </small>
          <>
  {!notification.is_read && (
    <button
      onClick={() =>
        dispatch(markNotificationRead(notification.id))
      }
    >
      Mark as Read
    </button>
  )}

  <button
    onClick={() => {
  if (window.confirm("Delete notification?")) {
    handleDelete(notification.id);
  }
}}
  >
    Delete
  </button>
</>

        </div>
        ))
      )}
      <div style={{ marginTop: "20px" }}>
  <button
    onClick={() => setPage(page - 1)}
    disabled={page === 1}
  >
    Previous
  </button>

  <span style={{ margin: "0 10px" }}>
    Page {page}
  </span>

  <button
  onClick={() => setPage(page + 1)}
  disabled={notifications.length < 5}
>
  Next
</button>
</div>
    </div>
  );
};

export default Notifications;