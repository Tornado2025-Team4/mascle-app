// ジム暦を計算
export const calculateTrainingPeriod = (startDate: string) => {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays}日`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}ヶ月`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    if (remainingMonths > 0) {
      return `${years}年${remainingMonths}ヶ月`;
    }
    return `${years}年`;
  }
};
