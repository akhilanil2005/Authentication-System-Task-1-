import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivities } from "../features/activity/activitySlice";
import type { RootState, AppDispatch } from "../app/store";
import Navbar from "../components/Navbar";

const ITEMS_PER_PAGE = 9;

const ActivityHistory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((state: RootState) => state.auth.userId);

  const { activities, loading, error } = useSelector(
    (state: RootState) => state.activity
  );

  const [currentPage, setCurrentPage] = useState(1);

  const sortedActivities = [...activities].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalPages = Math.ceil(sortedActivities.length / ITEMS_PER_PAGE);

  const paginatedActivities = sortedActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (userId) {
      dispatch(fetchActivities(userId));
    }
  }, [dispatch, userId]);

  // Reset to page 1 if the activity list changes (e.g. new items loaded)
  useEffect(() => {
    setCurrentPage(1);
  }, [activities.length]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />
      <div className="activity-container">
        {loading && <h2>Loading...</h2>}
        {error && <h2>{error}</h2>}
        {!loading && !error && (
          <>
            <h1 className="activity-title">Activity History</h1>
            <p className="activity-count">
              {activities.length} Activities Found
            </p>

            {activities.length === 0 ? (
              <p className="no-activity">No activity recorded yet.</p>
            ) : (
              <>
                <div className="activity-list">
                  {paginatedActivities.map((activity) => (
                    <div key={activity.id} className="activity-card">
                        <div className="activity-badge">
                      {activity.action === "LOGIN"
                          ? "🔐 LOGIN"
                          : activity.action === "LOGOUT"
                          ? "🚪 LOGOUT"
                          : activity.action === "REGISTER"
                          ? "📝 REGISTER"
                          : activity.action === "CREATE_NOTIFICATION"
                          ? "🔔 CREATE NOTIFICATION"
                          : activity.action === "READ_NOTIFICATION"
                          ? "👁 READ NOTIFICATION"
                          : activity.action === "DELETE_NOTIFICATION"
                          ? "🗑 DELETE NOTIFICATION"
                          : activity.action === "FILE_UPLOAD"
                          ? "📤 FILE UPLOAD"
                          : activity.action === "FILE_DELETE"
                          ? "🗑 FILE DELETE"
                          : activity.action === "PROFILE_UPDATE"
                          ? "✏️ PROFILE UPDATE"
                          : activity.action === "PASSWORD_CHANGE"
                          ? "🔑 PASSWORD CHANGE"
                          : activity.action === "ROLE_CHANGE"
                          ? "🛡️ ROLE CHANGE"
                          : activity.action === "USER_DELETE"
                          ? "❌ USER DELETE"
                          : activity.action}
                  </div>
                  {activity.details && (
                  <p className="activity-detail">{activity.details}</p>
                  )}
                  <p className="activity-date">
                  {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      Prev
                    </button>

                    <span className="page-number">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="page-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ActivityHistory;