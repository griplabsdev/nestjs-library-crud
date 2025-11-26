import { Not, MoreThan, MoreThanOrEqual, LessThan, LessThanOrEqual, Like, ILike, Between, In, IsNull, Raw } from 'typeorm';

import { operatorBetween, operatorIn, operatorNull } from '../interface/query-operation.interface';

import type { EntityType } from '../interface';
import type { QueryFilter } from '../interface/query-operation.interface';
import type { FindOptionsWhere } from 'typeorm';

export class TypeOrmQueryBuilderHelper {
    static queryFilterToFindOptionsWhere<T extends EntityType>(filter: QueryFilter<T>, index: number): FindOptionsWhere<T> {
        const prefix = (() => {
            let num = index;
            let letters = '';
            while (num >= 0) {
                letters = String.fromCharCode(65 + (num % 26)) + letters;
                num = Math.floor(num / 26) - 1;
            }
            return letters;
        })();
        let parametersIndex = 0;
        function getParameterName() {
            return [prefix, parametersIndex++].join('');
        }
        const findOptionsWhere: Record<string, unknown> = {};
        for (const [field, operation] of Object.entries(filter)) {
            // Check if it's a relation field (e.g., "news.title")
            const isRelationField = field.includes('.');
            let targetField: string;
            let relationName: string | undefined;

            if (isRelationField) {
                [relationName, targetField] = field.split('.');
            } else {
                targetField = field;
            }

            let fieldValue: unknown;
            if (operation.operator === operatorNull) {
                fieldValue = IsNull();
            }

            if ('operand' in operation) {
                const paramName = getParameterName();
                const { operator, operand } = operation;
                switch (operator) {
                    case '=':
                        fieldValue = operand;
                        break;
                    case '!=':
                        fieldValue = Not(operand);
                        break;
                    case '>':
                        fieldValue = MoreThan(operand);
                        break;
                    case '>=':
                        fieldValue = MoreThanOrEqual(operand);
                        break;
                    case '<':
                        fieldValue = LessThan(operand);
                        break;
                    case '<=':
                        fieldValue = LessThanOrEqual(operand);
                        break;
                    case 'LIKE':
                        fieldValue = Like(operand);
                        break;
                    case 'ILIKE':
                        fieldValue = ILike(operand);
                        break;
                    case '?':
                        fieldValue = Raw((alias) => `${alias} ? :${paramName}`, {
                            [paramName]: operand,
                        });
                        break;
                    case '@>':
                        fieldValue = Raw((alias) => `${alias} @> :${paramName}`, {
                            [paramName]: operand,
                        });
                        break;
                    case 'JSON_CONTAINS':
                        fieldValue = Raw((alias) => `JSON_CONTAINS (${alias}, :${paramName})`, {
                            [paramName]: operand,
                        });
                        break;
                    case operatorBetween:
                        fieldValue = Between(operand[0], operand[1]);
                        break;
                    case operatorIn:
                        fieldValue = In(operand);
                        break;
                }
            }

            if (fieldValue && 'not' in operation && operation.not) {
                fieldValue = Not(fieldValue);
            }

            // Handle relation fields by creating nested structure
            if (isRelationField && fieldValue !== undefined && relationName) {
                if (!findOptionsWhere[relationName]) {
                    findOptionsWhere[relationName] = {};
                }
                (findOptionsWhere[relationName] as Record<string, unknown>)[targetField] = fieldValue;
            } else if (fieldValue !== undefined) {
                findOptionsWhere[field] = fieldValue;
            }
        }

        return findOptionsWhere as FindOptionsWhere<T>;
    }
}
