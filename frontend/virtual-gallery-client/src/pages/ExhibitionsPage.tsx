import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { exhibitionsApi } from "../api/exhibitionsApi";
import type { Exhibition, ExhibitionCalendarItem } from "../types/exhibition";
import { formatDate } from "../utils/formatDate";

export function ExhibitionsPage() {
  const [active, setActive] = useState<Exhibition[]>([]);
  const [upcoming, setUpcoming] = useState<Exhibition[]>([]);
  const [completed, setCompleted] = useState<Exhibition[]>([]);
  const [calendar, setCalendar] = useState<ExhibitionCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [activeData, upcomingData, completedData, calendarData] =
          await Promise.all([
            exhibitionsApi.getActive(),
            exhibitionsApi.getUpcoming(),
            exhibitionsApi.getCompleted(),
            exhibitionsApi.getCalendar(),
          ]);

        setActive(activeData);
        setUpcoming(upcomingData);
        setCompleted(completedData);
        setCalendar(calendarData);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const renderList = (items: Exhibition[]) => {
    if (items.length === 0) {
      return <p className="muted">Нет данных.</p>;
    }

    return (
      <div className="card-grid">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <div className="card-body">
              <h3>{item.title}</h3>
              <p className="muted">Тема: {item.theme}</p>
              <p>{item.description}</p>
              <p className="muted">Статус: {item.status}</p>
              <p className="muted">
                Проведение: {formatDate(item.startDate)} — {formatDate(item.endDate)}
              </p>
              <p className="muted">Работ: {item.artworkCount}</p>
              <Link to={`/exhibitions/${item.id}`} className="inline-link">
                Открыть выставку
              </Link>
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <section>
      <div className="section-header">
        <h1>Выставки</h1>
        <p>Текущие, будущие и завершённые тематические выставки.</p>
      </div>

      {loading ? (
        <p>Загрузка выставок...</p>
      ) : (
        <>
          <section className="section-block">
            <h2>Активные выставки</h2>
            {renderList(active)}
          </section>

          <section className="section-block">
            <h2>Будущие выставки</h2>
            {renderList(upcoming)}
          </section>

          <section className="section-block">
            <h2>Завершённые выставки</h2>
            {renderList(completed)}
          </section>

          <section className="section-block">
            <h2>Календарь выставок</h2>
            <div className="table-wrapper">
              <table className="calendar-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Тема</th>
                    <th>Приём заявок</th>
                    <th>Проведение</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {calendar.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.theme}</td>
                      <td>
                        {formatDate(item.submissionStartDate)} —{" "}
                        {formatDate(item.submissionEndDate)}
                      </td>
                      <td>
                        {formatDate(item.startDate)} — {formatDate(item.endDate)}
                      </td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}