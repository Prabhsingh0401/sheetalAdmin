import BasicInfo from "../models/basicInfo.model.js";

const ensureBasicInfo = async () => {
  const basicInfo = await BasicInfo.findOne();
  if (!basicInfo) {
    return BasicInfo.create({});
  }
  return basicInfo;
};

const normalizeAddress = (value = {}) => {
  if (!value || typeof value !== "object") {
    return {
      addressLine: typeof value === "string" ? value : "",
      pincode: "",
      city: "",
      state: "",
      country: "",
    };
  }

  return {
    addressLine: value.addressLine ?? "",
    pincode: value.pincode ?? "",
    city: value.city ?? "",
    state: value.state ?? "",
    country: value.country ?? "",
  };
};

export const getBasicInfo = async () => {
  try {
    const basicInfo = await ensureBasicInfo();
    const data = basicInfo.toObject ? basicInfo.toObject() : basicInfo;
    return {
      success: true,
      data: {
        ...data,
        shippingAddress: normalizeAddress(data.shippingAddress),
        billingAddress: normalizeAddress(data.billingAddress),
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateBasicInfo = async (data, userId = null) => {
  try {
    const payload = {
      gstNumber: data.gstNumber ?? "",
      shippingAddress: normalizeAddress(data.shippingAddress),
      billingAddress: normalizeAddress(data.billingAddress),
    };

    if (userId) {
      payload.updatedBy = userId;
    }

    const basicInfo = await BasicInfo.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    return { success: true, data: basicInfo };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
