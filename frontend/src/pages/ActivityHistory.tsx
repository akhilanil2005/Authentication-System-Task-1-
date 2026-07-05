import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivities } from "../features/activity/activitySlice";
import type { RootState, AppDispatch } from "../app/store";
import Navbar from "../components/Navbar";

const ActivityHistory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((state: RootState) => state.auth.userId);

  const { activities, loading, error } = useSelector(
    (state: RootState) => state.activity
  );

  const sortedActivities = [...activities].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  useEffect(() => {
    if (userId) {
      dispatch(fetchActivities(userId));
    }
  }, [dispatch, userId]);

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
              <div className="activity-list">
                {sortedActivities.map((activity) => (
                  <div key={activity.id} className="activity-card">
                    <div className="activity-badge">
                      {activity.action === "LOGIN"
                        ? "🔐 LOGIN"
                        : activity.action === "CREATE_NOTIFICATION"
                        ? "🔔 CREATE NOTIFICATION"
                        : activity.action}
                    </div>
                    <p className="activity-date">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ActivityHistory;