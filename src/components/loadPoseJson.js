import fetch from "node-fetch";




// utils/loadPoseJson.js
export const loadPoseFromJson = async (techniqueName) => {
    try {
      const response = await fetch(`/ballet_pose_data/${techniqueName.replace(' ', '_')}.json`);
      const data = await response.json();
      console.log(data)
      return data.landmarks;
    } catch (error) {
      console.error("Failed to load pose JSON:", error);
      return null;
    }
  };
  