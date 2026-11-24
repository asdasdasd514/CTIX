import { useState } from "react";
import { Link } from "react-router-dom";
import { useIncidentStore } from "../../store/useIncidentStore";
import { CATEGORIES, incidentStats } from "../../lib/incidents";
export function StatisticsPage() {
  const incidents = useIncidentStore((s) => s.incidents);
  const [month, setMonth] = useState("2026-11");
  const items = incidents.filter(
    (i) =>
      !month ||
      new Date(i.createdAt)
        .toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
        .startsWith(month),
  );
  const stats = incidentStats(items);
  const decimal = (value: number | null) =>
    value === null
      ? "Chưa có dữ liệu"
      : value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  return (
    <div className="officer-workbench">
      <div className="work-heading">
        <div>
          <h2>Thống kê phản ánh</h2>
          <p>Dữ liệu tính từ hồ sơ Phường Trấn Biên</p>
        </div>
        <label>
          Tháng tiếp nhận{" "}
          <input
            aria-label="Tháng tiếp nhận"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>
      <section className="work-surface work-detail">
        <table className="work-stat-table">
          <caption>Kết quả tiếp nhận và xử lý</caption>
          <tbody>
            {[
              ["Tổng tiếp nhận", stats.total],
              ["Đã xử lý", `${stats.completed}/${stats.total}`],
              [
                "Tỷ lệ đã xử lý",
                stats.total
                  ? `${decimal((stats.completed / stats.total) * 100)}%`
                  : "Chưa có dữ liệu",
              ],
              [
                "Thời gian xử lý trung bình",
                stats.averageDays === null
                  ? "Chưa có dữ liệu"
                  : `${decimal(stats.averageDays)} ngày`,
              ],
              [
                "Tỷ lệ đúng hạn (hồ sơ hoàn tất có hạn)",
                stats.onTime === null
                  ? "Chưa đủ dữ liệu"
                  : `${decimal(stats.onTime)}%`,
              ],
              [
                "Đánh giá trung bình",
                stats.averageRating === null
                  ? "Chưa có đánh giá"
                  : `${decimal(stats.averageRating)}/5 · ${stats.rated} lượt`,
              ],
            ].map(([name, value]) => (
              <tr key={name}>
                <th>{name}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Cơ cấu theo loại sự cố</h3>
        <div className="category-stats">
          {Object.entries(CATEGORIES).map(([key, label]) => {
            const count = items.filter((i) => i.category === key).length;
            return (
              <div key={key}>
                <span>{label}</span>
                <progress
                  value={count}
                  max={items.length || 1}
                  aria-label={label}
                />
                <strong>{count}</strong>
              </div>
            );
          })}
        </div>
        <p className="work-help">
          Thời gian trung bình tính từ lúc gửi đến lúc hoàn tất. Tỷ lệ đúng hạn
          chỉ tính hồ sơ có cả hạn xử lý và thời điểm hoàn tất.
        </p>
        <Link className="work-text-link" to="/dashboard">
          ← Quay lại bàn làm việc
        </Link>
      </section>
    </div>
  );
}
