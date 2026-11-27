import axiosClient from "../http/axiosClient";

const reportApi = {
  getRevenue: () => axiosClient.get("/reports/revenue"),
};

export default reportApi;