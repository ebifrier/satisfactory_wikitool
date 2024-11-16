import React from "react";
import Link from "next/link";
import * as Icon from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/index";
import { PageHead } from "@/components";
import { actions } from "@/features/compchartSlice";

//
// メインコンポーネント
//
const CompChartListPage: React.FC = () => {
  const charts = useAppSelector((state) => state.compCharts.charts);
  const dispatch = useAppDispatch();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <PageHead title="レシピ比較表一覧" />

      <div className="col-span-full flex mb-2">
        <h1 className="flex-none inline-block text-4xl font-bold text-gray-800">
          レシピ比較表一覧
        </h1>
        <span className="flex-1 inline-block my-auto text-right">
          <button
            className="size-6 text-blue-400"
            onClick={() => dispatch(actions.addChart({}))}
          >
            <Icon.ArrowDownOnSquareIcon />
          </button>
        </span>
      </div>

      {charts.map((chart) => (
        <div
          key={chart.id}
          className="p-4 bg-white border rounded-lg shadow-md"
        >
          <Icon.DocumentIcon className="size-6 inline-block" />
          <Link href={`/compchart/${chart.id}`}>
            <span className="font-semibold ml-1 align-bottom">
              {chart.name}
            </span>
          </Link>
          <button
            type="button"
            className="float-right"
            onClick={() => dispatch(actions.deleteChart({ chartId: chart.id }))}
          >
            <Icon.TrashIcon className="size-6 text-red-400" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default CompChartListPage;
