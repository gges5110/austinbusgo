import graphene


class GeometryType(graphene.Enum):
    Point = "Point"
    LineString = "LineString"
    MultiPoint = "MultiPoint"
    MultiLineString = "MultiLineString"
    Polygon = "Polygon"
    MultiPolygon = "MultiPolygon"
    GeometryCollection = "GeometryCollection"


class Point(graphene.ObjectType):
    """Point Scalar Description"""

    type = graphene.Field(GeometryType, required=True)
    coordinates = graphene.List(graphene.NonNull(graphene.Float), required=True)


class LineString(graphene.ObjectType):
    """LineString Scalar Description"""

    type = graphene.Field(GeometryType, required=True)
    coordinates = graphene.List(
        graphene.NonNull(
            graphene.List(graphene.NonNull(graphene.Float), required=True)
        ),
        required=True,
    )
