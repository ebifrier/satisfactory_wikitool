import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import Select from "react-select";
import {
  Option,
  TCondition,
  TRecipe,
  TableUtil,
  TTableData,
  paramToStr,
  fetcher,
  createRecipeData,
  createRecipesForBuildingData,
  createRecipesForItemData,
  createMilestonesData,
  createResearchesData,
} from "@/index";
import {
  PageHead,
  TableData,
  useItemOptions,
  findSelectedItem,
} from "@/components";

type DataTableWithTitleProps = {
  title: string;
  data?: TTableData;
};

const DataTableWithTitle: React.FC<DataTableWithTitleProps> = ({
  title,
  data,
}) => {
  const wikiText = React.useMemo(
    () => `${TableUtil.dataToWIKI(data)}\n`,
    [data]
  );

  return (
    <>
      <div className="mt-8 col-span-full">
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      {data == null ? (
        <p className="col-span-full text-gray-500">データ読み込み中...</p>
      ) : data.rows.length <= 2 ? (
        <p className="col-span-full text-gray-500">
          表示する項目はありません。
        </p>
      ) : (
        <>
          <TableData data={data} />

          <textarea
            className="w-full h-full border border-gray-500 focus:border-blue-500"
            wrap="off"
            placeholder="placeholder"
            defaultValue={wikiText}
          ></textarea>
        </>
      )}
    </>
  );
};

function ItemPage() {
  const router = useRouter();
  const itemId = paramToStr(router.query.itemId);

  const setItemId = React.useCallback(
    (value?: string) => {
      if (itemId != value) {
        const { pathname } = router;
        router.replace({ pathname, query: { itemId: value } });
      }
    },
    [router, itemId]
  );

  const { itemOptions } = useItemOptions();
  const selectedOption = React.useMemo(
    () => findSelectedItem(itemId, itemOptions),
    [itemId, itemOptions]
  );

  const { data: recipesProducingData } = useSWR(
    [itemId, `/api/v1/item/${itemId}/recipes/producing`],
    async ([itemId, key]) => {
      const data = itemId != null ? await fetcher<TRecipe[]>(key) : [];
      return data?.map((recipe) => createRecipeData(itemId ?? "", recipe));
    }
  );

  const { data: recipesForItemData } = useSWR(
    [itemId, `/api/v1/item/${itemId}/recipes/using_for_item`],
    async ([itemId, key]) => {
      const data = itemId != null ? await fetcher<TRecipe[]>(key) : [];
      return createRecipesForItemData(itemId ?? "", data);
    }
  );

  const { data: recipesForBuildingData } = useSWR(
    [itemId, `/api/v1/item/${itemId}/recipes/using_for_building`],
    async ([itemId, key]) => {
      const data = itemId != null ? await fetcher<TRecipe[]>(key) : [];
      return createRecipesForBuildingData(itemId ?? "", data);
    }
  );

  const { data: milestonesData } = useSWR(
    [itemId, `/api/v1/item/${itemId}/milestones`],
    async ([itemId, key]) => {
      const data = itemId != null ? await fetcher<TCondition[]>(key) : [];
      return createMilestonesData(itemId ?? "", data);
    }
  );

  const { data: researchesData } = useSWR(
    [itemId, `/api/v1/item/${itemId}/researches`],
    async ([itemId, key]) => {
      const data = itemId != null ? await fetcher<TCondition[]>(key) : [];
      return createResearchesData(itemId ?? "", data);
    }
  );

  return (
    <div
      id="main"
      className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-x-4 gap-y-2 2xl:max-w-8xl"
    >
      <PageHead title="素材詳細" />

      <div className="col-span-full">
        <h1 className="text-4xl font-bold text-gray-800">素材詳細</h1>
      </div>

      <div className="mt-6 col-span-full">
        <Select<Option, false>
          options={itemOptions}
          value={selectedOption}
          onChange={(option) => setItemId(option?.value)}
          isSearchable={true}
          className="mt-1 sm:text-sm"
        />
      </div>

      <div className="mt-6 col-span-full">
        <h1 className="text-4xl font-bold text-gray-800">
          {selectedOption?.label}
        </h1>
      </div>

      <div className="mt-6 col-span-full">
        <h2 className="text-2xl font-semibold">作成レシピ</h2>
      </div>

      {recipesProducingData == null ? (
        <p className="col-span-full text-gray-500">データ読み込み中...</p>
      ) : recipesProducingData.length == 0 ? (
        <p className="col-span-full text-gray-500">
          表示する項目はありません。
        </p>
      ) : (
        <>
          <div className="recipes-producing-table">
            {recipesProducingData.map((data, index) => (
              <TableData key={index} data={data} />
            ))}
          </div>
          <textarea
            className="w-full h-full border border-gray-500 focus:border-blue-500"
            wrap="off"
            placeholder="placeholder"
            defaultValue={`${recipesProducingData
              .map((recipe) => TableUtil.dataToWIKI(recipe))
              .join("\n")}\n`}
          ></textarea>
        </>
      )}

      <DataTableWithTitle
        title="利用先 部品・装備品"
        data={recipesForItemData}
      />

      <DataTableWithTitle
        title="利用先 設備・車両"
        data={recipesForBuildingData}
      />

      <DataTableWithTitle title="マイルストーン" data={milestonesData} />
      <DataTableWithTitle title="分子分析機" data={researchesData} />
    </div>
  );
}

export default ItemPage;
