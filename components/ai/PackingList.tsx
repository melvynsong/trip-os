import React from "react";
import { PackingList } from "@/types/packing-list";

interface PackingListProps {
  packingList: PackingList;
}

export const PackingListComponent: React.FC<PackingListProps> = ({ packingList }) => {
  if (!packingList || !packingList.categories?.length) {
    return <div>No packing list available.</div>;
  }
  return (
    <div className="packing-list">
      {packingList.categories.map((cat) => (
        <div key={cat.category} className="packing-category">
          <h3>{cat.category}</h3>
          <ul>
            {cat.items.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                {" x "}
                <span>{item.quantity}</span>
                {item.notes && <span className="notes"> — {item.notes}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PackingListComponent;
