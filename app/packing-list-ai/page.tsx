"use client";
import React, { useState } from "react";
import PackingListComponent from "@/components/ai/PackingList";
import { PackingList } from "@/types/packing-list";

const defaultForm = {
  destination: "",
  start_date: "",
  end_date: "",
  number_of_days: 1,
  weather: "",
  packing_style: "moderate",
};

export default function PackingListAIPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "number_of_days" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPackingList(null);
    try {
      const res = await fetch("/api/ai/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to generate packing list");
      const data = await res.json();
      setPackingList(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Packing List AI</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="destination" value={form.destination} onChange={handleChange} required placeholder="Destination" className="w-full border p-2" />
        <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required className="w-full border p-2" />
        <input name="end_date" type="date" value={form.end_date} onChange={handleChange} required className="w-full border p-2" />
        <input name="number_of_days" type="number" min={1} value={form.number_of_days} onChange={handleChange} required className="w-full border p-2" />
        <input name="weather" value={form.weather} onChange={handleChange} required placeholder="Weather (summary or daily)" className="w-full border p-2" />
        <select name="packing_style" value={form.packing_style} onChange={handleChange} className="w-full border p-2">
          <option value="light">Light</option>
          <option value="moderate">Moderate</option>
          <option value="heavy">Heavy</option>
        </select>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded">
          {loading ? "Generating..." : "Generate Packing List"}
        </button>
      </form>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {packingList && (
        <div className="mt-6">
          <PackingListComponent packingList={packingList} />
        </div>
      )}
    </div>
  );
}
