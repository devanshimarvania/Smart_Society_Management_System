import api from "./api";

const getPolls = (params) => api.get("/polls", { params });
const getPollResults = (id) => api.get(`/polls/${id}`);
const createPoll = (data) => api.post("/polls", data);
const castVote = (id, optionId) => api.post(`/polls/${id}/vote`, { optionId });
const closePoll = (id) => api.put(`/polls/${id}/close`);
const deletePoll = (id) => api.delete(`/polls/${id}`);

export default { getPolls, getPollResults, createPoll, castVote, closePoll, deletePoll };
