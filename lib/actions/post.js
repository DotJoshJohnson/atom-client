import db, { upsert } from "../local-cache";
import { saveMarkers } from "./marker";
import { saveMarkerLocations } from "./marker-location";

export const savePost = attributes => dispatch => {
	return upsert(db, "posts", attributes).then(post => {
		dispatch({
			type: "ADD_POST",
			payload: post
		});
	});
};

export const savePosts = attributes => dispatch => {
	return upsert(db, "posts", attributes).then(posts => {
		dispatch({
			type: "ADD_POSTS",
			payload: posts
		});
	});
};

export const savePostsForStream = (streamId, attributes) => dispatch => {
	return upsert(db, "posts", attributes).then(posts => {
		dispatch({
			type: "ADD_POSTS_FOR_STREAM",
			payload: { streamId, posts }
		});
	});
};

export const savePendingPost = attributes => dispatch => {
	return upsert(db, "posts", attributes).then(post => {
		dispatch({
			type: "ADD_PENDING_POST",
			payload: post
		});
	});
};

export const resolvePendingPost = (id, { post, markers, markerLocations }) => dispatch => {
	return db
		.transaction("rw", db.posts, async () => {
			await db.posts.delete(id);
			await db.posts.add(post);
		})
		.then(async () => {
			await dispatch(saveMarkers(markers));
			await dispatch(saveMarkerLocations(markerLocations));
		})
		.then(() => {
			dispatch({
				type: "RESOLVE_PENDING_POST",
				payload: {
					pendingId: id,
					post
				}
			});
		});
};

export const rejectPendingPost = (streamId, pendingId, post) => dispatch => {
	// TODO
};