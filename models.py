from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Item(db.Model):
    id = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    index = db.Column(db.Integer, nullable=False)
    kind = db.Column(db.String(128), nullable=False)
    jpwiki_id = db.Column(db.String(128), nullable=False)
    category = db.Column(db.String(64), nullable=False)
    coupons = db.Integer()

    @property
    def kind_name(self) -> str:
        match self.kind.lower():
            case 'material':
                return "パーツ"
            case 'equipment':
                return "装備品"
            case _:
                raise Exception(f'unknown item_type "{self.kind}"')

    @property
    def jpwiki_link(self) -> str:
        return f'素材/{self.jpwiki_id}'

    def __str__(self):
        return self.name


class Building(db.Model):
    id = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    index = db.Column(db.Integer, nullable=False)
    jpwiki_id = db.Column(db.String(128), nullable=False)
    category = db.Column(db.String(64), nullable=False)
    subcategory = db.Column(db.String(64), nullable=False)
    power = db.Column(db.Integer)
    max_inputs = db.Column(db.Integer)
    max_outputs = db.Column(db.Integer)

    @property
    def max_inouts(self) -> int:
        return max(self.max_inputs, self.max_outputs)

    @property
    def is_buildgun(self) -> bool:
        """手動で建築するかどうかを確認します。"""
        return self.id == 'Build_Gun'

    @property
    def is_craftbench(self) -> bool:
        """工作台で作成するかどうかを確認します。"""
        return self.id == 'Craft_Bench'

    @property
    def is_equipment(self) -> bool:
        """装備品作業場で作成するかどうかを確認します。"""
        return self.id == 'Equipment_Workshop'

    @property
    def is_manual(self) -> bool:
        """工作台や装備品作業場で作成するかどうかを確認します。"""
        return self.is_buildgun or self.is_craftbench or self.is_equipment

    @property
    def jpwiki_link(self) -> str:
        link_cat = self.category if self.category != '特殊' else 'スペシャル'
        return f'建築物/{link_cat}#{self.jpwiki_id}'

    def __str__(self):
        return self.name


class RecipeItem(db.Model):
    __tablename__ = 'recipe_item'
    recipe_id = db.Column(db.String(128), db.ForeignKey('recipe.id'), primary_key=True)
    item_id = db.Column(db.String(128), db.ForeignKey('item.id'), primary_key=True)
    item = db.relationship('Item', foreign_keys=[item_id])
    role = db.Column(db.String(64), primary_key=True)  # 'ingredient' or 'product'
    index = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    minute = db.Column(db.Float, nullable=False)

    @property
    def name(self) -> str:
        return self.item.name

    @property
    def jpwiki_id(self) -> str:
        return self.item.jpwiki_id

    @property
    def jpwiki_link(self) -> str:
        return self.item.jpwiki_link

    def as_building(self) -> Building | None:
        return Building.query.get(self.item_id)

    @property
    def amount_str(self) -> str:
        if self.amount == round(self.amount):
            return f'{int(self.amount)}'
        else:
            return f'{self.amount}'

    @property
    def minute_str(self) -> str:
        return f'{self.minute:.2f}'


class Recipe(db.Model):
    id = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    index = db.Column(db.Integer, nullable=False)
    jpwiki_id = db.Column(db.String(128), nullable=False)
    link_anchor = db.Column(db.String(32), nullable=False)
    alternate = db.Column(db.Boolean, nullable=False)
    condition_id = db.Column(db.String(256), db.ForeignKey('condition.id'), nullable=True)
    condition = db.relationship('Condition', foreign_keys=[condition_id])
    production_time = db.Column(db.Float, nullable=False)
    production_time2 = db.Column(db.Float)
    building_id = db.Column(db.String(128), db.ForeignKey('building.id'), nullable=False)
    building = db.relationship('Building', foreign_keys=[building_id])
    building2_id = db.Column(db.String(128), db.ForeignKey('building.id'))
    building2 = db.relationship('Building', foreign_keys=[building2_id])
    ingredients = db.relationship('RecipeItem',
                                  primaryjoin="and_(Recipe.id == RecipeItem.recipe_id, RecipeItem.role == 'ingredient')",
                                  order_by='RecipeItem.index')
    products = db.relationship('RecipeItem',
                               primaryjoin="and_(Recipe.id == RecipeItem.recipe_id, RecipeItem.role == 'product')",
                               order_by='RecipeItem.index',
                               overlaps='ingredients')

    @property
    def jpwiki_link(self) -> str:
        link_anchor = self.link_anchor if self.link_anchor else "N1"
        return f'素材/{self.jpwiki_id}#Recipe_{link_anchor}'

    def is_byproduct(self, item_id: str) -> bool:
        return self.products[0].item_id != item_id

    def bg_color(self, item_id: str) -> str:
        if self.is_byproduct(item_id):
            return '#eee'
        elif self.alternate:
            return '#fff6f6'
        else:
            return '#f6fff6'

    @property
    def production_time_str(self) -> str:
        if self.production_time == round(self.production_time):
            return f'{int(self.production_time)}'
        else:
            return f'{self.production_time}'

    @property
    def production_time2_str(self) -> str | None:
        if self.production_time2 is None:
            return None
        return f'{int(self.production_time2)}'

    def get_ingredient(self, i: int) -> RecipeItem | None:
        if 0 <= i and i < len(self.ingredients):
            return self.ingredients[i]
        return None

    def get_product(self, i: int | str) -> RecipeItem | None:
        if 0 <= i and i < len(self.products):
            return self.products[i]
        return None

    def find_ingredient(self, item_id: str) -> RecipeItem | None:
        for ing in self.ingredients:
            if ing.item_id == item_id:
                return ing
        return None

    def find_product(self, item_id: str) -> RecipeItem | None:
        for prod in self.products:
            if prod.item_id == item_id:
                return prod
        return None

    def __str__(self):
        return self.name


class ConditionItem(db.Model):
    __tablename__ = 'condition_item'
    condition_id = db.Column(db.String(256), db.ForeignKey('condition.id'), primary_key=True)
    item_id = db.Column(db.String(128), db.ForeignKey('item.id'), primary_key=True)
    item = db.relationship('Item', foreign_keys=[item_id])
    index = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Integer, nullable=False)

    def __str__(self):
        return self.name


class Condition(db.Model):
    id = db.Column(db.String(256), primary_key=True)
    kind = db.Column(db.String(32), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    index = db.Column(db.Integer, nullable=False)
    link_anchor = db.Column(db.String(128), nullable=False)
    time = db.Column(db.Interval, nullable=False)
    category = db.Column(db.String(64), nullable=True)
    tier = db.Column(db.Integer, nullable=True)
    items = db.relationship('ConditionItem',
                            primaryjoin="Condition.id == ConditionItem.condition_id",
                            order_by='ConditionItem.index')

    @property
    def jpwiki_link(self) -> str:
        if self.kind == 'milestone':
            return f'プロジェクト/マイルストーン#{self.link_anchor}'
        elif self.kind == 'research':
            return f'プロジェクト/分析#{self.link_anchor}'

    def find_item(self, item_id: str) -> ConditionItem | None:
        for item in self.items:
            if item.item_id == item_id:
                return item
        return None

    def __str__(self):
        return self.name
