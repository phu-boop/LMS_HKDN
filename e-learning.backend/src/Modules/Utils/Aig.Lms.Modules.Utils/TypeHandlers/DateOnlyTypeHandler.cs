using System.Data;
using Dapper;

namespace Aig.Lms.Modules.Utils.TypeHandlers;

public class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value = value.ToDateTime(TimeOnly.MinValue);
    }

    public override DateOnly Parse(object value)
    {
        return value switch
        {
            DateTime dt => DateOnly.FromDateTime(dt),
            string s    => DateOnly.Parse(s),
            _           => throw new DataException($"Cannot convert {value.GetType()} to DateOnly")
        };
    }
}