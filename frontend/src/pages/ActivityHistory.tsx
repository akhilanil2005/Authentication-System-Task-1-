import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivities } from "../features/activity/activitySlice";
import type { RootState, AppDispatch } from "../app/store";

const ActivityHistory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector(
  (state: RootState) => state.auth.userId
);

  const { activities, loading, error } = useSelector(
    (state: RootState) => state.activity
  );

  useEffect(() => {
   if (userId) {
  dispatch(fetchActivities(userId));
}
  }, [dispatch, userId]);

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>{error}</h2>;

  return (
    <div>
      <h1>Activity History</h1>

      {activities.map((activity) => (
        <div key={activity.id}>
          <h3>{activity.action}</h3>
          <small>{activity.created_at}</small>
        </div>
      ))}
    </div>
  );
};

export default ActivityHistory;