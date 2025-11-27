# @nestjs-library/crud

<p align="center">
    <img src="https://github.com/woowabros/nestjs-library-crud/actions/workflows/ci.yml/badge.svg" alt="Node.js CI">
    <a href='https://coveralls.io/github/woowabros/nestjs-library-crud?branch=main'>
        <img src='https://coveralls.io/repos/github/woowabros/nestjs-library-crud/badge.svg?branch=main' alt='Coverage Status' />
    </a>
    <a href="https://www.npmjs.com/package/@nestjs-library/crud">
        <img src="https://img.shields.io/npm/v/@nestjs-library/crud">
    </a>
    <a href="https://www.npmjs.com/package/@nestjs-library/crud">
        <img src="https://img.shields.io/bundlephobia/minzip/@nestjs-library/crud">
    </a>
    <a href="https://www.npmjs.com/package/@nestjs-library/crud">
        <img src="https://img.shields.io/npm/dw/@nestjs-library/crud">
    </a>        
</p>

<p align="center">
    <a href="./README.md">
        <span>English<span>
    </a> 
    <span>|</span>
    <a href="./README.ko.md">
        <span>한국어<span>
    </a> 
</p>

CRUD Rest API를 자동으로 생성하는 라이브러리입니다.

`NestJS`와 `TypeORM` 기반으로 작성되었습니다.

## 기능

Entity를 기반으로 ReadOne, ReadMany, Search, Update, Insert, Upsert, Delete, Recover API과 Swagger Documents를 제공합니다.

-   TypeOrm이 지원하는 모든 종류의 DBMS에서 사용할 수 있습니다.
-   모든 API는 `Swagger` Document를 제공하며, `Decorator`를 통해 Override 할 수 있습니다.
-   모든 API는 `Options`을 통해 관리할 수 있으며, Request 별로 제어가 필요한 경우 `Interceptor`를 통해 Request와 Response를 관리할 수 있습니다.
-   모든 API는 `Validation`을 위한 Dto를 제공하고 있으며, Entity에 정의된 `groups` 정보를 통해 자동으로 생성합니다.
-   `ReadMany`와 `Search`는 Cursor와 Offset Type의 페이지네이션을 제공합니다.
-   `ReadMany`를 통해 단순한 조건으로 조회를 할 수 있다면, `Search`는 복잡한 조건으로 조회할 수 있습니다.
-   `SoftDelete`와 `Recover`를 지원합니다.
-   구현된 `많은 기능과 사례`는 작성된 <a href="./spec"> <span>예제<span></a>를 확인할 수 있습니다.

---

## 설치

```bash
# npm
npm install @nestjs-library/crud

# yarn
yarn add @nestjs-library/crud

# pnpm
pnpm add @nestjs-library/crud
```

## 사용 방법

---

### Step 1. Entity를 정의합니다.

Crud decorator를 사용하기 위해서는 먼저 TypeORM Entity를 정의해야 합니다.
다음의 예시에서는 id, username, email 속성을 가진 User Entity를 정의합니다.

```typescript
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    email: string;
}
```

### Step 2: Service provider를 생성합니다.

TypeORM Entity에 대한 NestJS Service 를 생성합니다.
이 때 Service 객체는 CrudService를 상속해야 합니다.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudService } from '@nestjs-library/crud';
import { Repository } from 'typeorm';

import { User } from './user.entity';

@Injectable()
export class UserService extends CrudService<User> {
    constructor(@InjectRepository(User) repository: Repository<User>) {
        super(repository);
    }
}
```

### Step 3. Controller를 생성합니다.

TypeORM Entity에 대한 NestJS Controller 를 생성합니다.
이 때 Controller 객체는 CrudController를 구현해야 합니다.

```typescript
import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@nestjs-library/crud';

import { User } from './user.entity';
import { UserService } from './user.service';

@Crud({ entity: User })
@Controller('users')
export class UserController implements CrudController<User> {
    constructor(public readonly crudService: UserService) {}
}
```

### Step 4: 생성된 Entity와 Service, Controller를 Module에 추가합니다.

NestJS 모듈을 정의합니다. 위에서 생성한 Entity, Service, Controller를 각각 imports, controllers, providers에 추가합니다.

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
```

### Step 5: Server를 시작하고 CRUD API를 확인할 수 있습니다.

모듈이 초기화되면 다음의 endpoint가 자동으로 생성됩니다.

-   `GET /users` - pagination을 적용하여 user의 목록을 조회합니다.
-   `GET /users/:id` - ID를 기반으로 단일한 user를 조회합니다.
-   `POST /users` - 단일한, 혹은 여러 명의 user를 생성합니다.
-   `PATCH /users/:id` - ID를 기반으로 기존의 user를 수정합니다.
-   `DELETE /users/:id` - ID를 기반으로 기존의 user를 삭제합니다.
-   `PUT /users/:id` - ID를 기반으로 기존의 user를 upsert (수정하거나 생성) 합니다.
-   `POST /users/search` - 복잡한 검색 조건을 적용하여 user의 목록을 조회합니다.
-   `POST /users/:id/recover` - ID를 기반으로 soft delete 된 user를 복구합니다.

---

## 설정

Crud decorator는 다음과 같은 옵션을 제공합니다.

### entity

(required) controller가 다룰 TypeORM Entity를 지정합니다.

### routes

(optional) 옵션을 지정하여 각각의 route를 설정합니다.

예를 들어 Search route의 기본 pagination 크기를 설정하고 싶다면, 다음과 같이 옵션을 지정할 수 있습니다.

```typescript
@Crud({
    entity: User,
    routes: {
        search: { numberOfTake: 5 },
    },
})
```

모든 route는 다음의 기본 옵션들을 가질 수 있습니다.

```typescript
import { NestInterceptor, Type } from '@nestjs/common';

interface RouteBaseOption {
    decorators?: Array<PropertyDecorator | MethodDecorator>;
    interceptors?: Array<Type<NestInterceptor>>;
    swagger?: {
        hide?: boolean;
        response?: Type<unknown>;
    };
}
```

`CREATE`, `UPDATE`, `DELETE`, `UPSERT`, `RECOVER` route는 다음의 옵션을 가질 수 있습니다.

```typescript
interface SaveOptions {
    listeners?: boolean;
}
```

각각의 route는 아래와 같은 옵션을 가질 수 있습니다.

#### `READ_ONE`

```typescript
interface ReadOneOptions {
    params?: string[];
    softDelete?: boolean;
    relations?: false | string[];
}
```

#### `READ_MANY`

```typescript
import { Sort, PaginationType } from 'src/lib/interface';

interface ReadManyOptions {
    sort?: Sort | `${Sort}`;
    paginationType?: PaginationType | `${PaginationType}`;
    numberOfTake?: number;
    relations?: false | string[];
    softDelete?: boolean;
    paginationKeys?: string[];
}
```

#### `SEARCH`

```typescript
import { PaginationType } from 'src/lib/interface';

interface SearchOptions {
    paginationType?: PaginationType | `${PaginationType}`;
    numberOfTake?: number;
    limitOfTake?: number;
    relations?: false | string[];
    softDelete?: boolean;
    paginationKeys?: string[];
}
```

---

## Search API 상세 가이드

`POST /users/search` 엔드포인트는 복잡한 검색 조건을 사용하여 데이터를 조회할 수 있는 강력한 기능을 제공합니다.

### 기본 사용법

Search API는 다음과 같은 요청 본문을 받습니다:

```typescript
interface RequestSearchDto {
    select?: string[]; // 조회할 필드 목록
    where?: Array<QueryFilter>; // 검색 조건
    order?: Record<string, 'ASC' | 'DESC'>; // 정렬 조건
    withDeleted?: boolean; // soft delete된 데이터 포함 여부
    take?: number; // 조회할 데이터 개수 (cursor pagination)
    limit?: number; // 조회할 데이터 개수 (offset pagination)
    offset?: number; // 건너뛸 데이터 개수 (offset pagination)
    nextCursor?: string; // 다음 페이지 커서 (cursor pagination)
}
```

### where 조건 사용법

`where` 조건은 배열 형태로 여러 조건을 AND 연산으로 결합할 수 있습니다.

#### 기본 연산자

다음과 같은 연산자를 사용할 수 있습니다:

-   `=` : 같음
-   `!=` : 같지 않음
-   `>` : 보다 큼
-   `>=` : 보다 크거나 같음
-   `<` : 보다 작음
-   `<=` : 보다 작거나 같음
-   `LIKE` : 패턴 매칭 (대소문자 구분)
-   `ILIKE` : 패턴 매칭 (대소문자 구분 안 함)
-   `BETWEEN` : 범위 검색
-   `IN` : 목록에 포함
-   `NULL` : NULL 값 검색

#### 기본 예시

```json
POST /users/search
{
  "where": [
    { "username": { "operator": "LIKE", "operand": "john%" } },
    { "email": { "operator": "=", "operand": "john@example.com" } }
  ]
}
```

#### NOT 연산자

모든 연산자에 `not: true` 옵션을 추가하여 NOT 연산을 수행할 수 있습니다:

```json
{
    "where": [{ "username": { "operator": "LIKE", "operand": "admin%", "not": true } }]
}
```

#### BETWEEN 연산자

```json
{
    "where": [{ "age": { "operator": "BETWEEN", "operand": [20, 30] } }]
}
```

#### IN 연산자

```json
{
    "where": [{ "status": { "operator": "IN", "operand": ["active", "pending"] } }]
}
```

#### NULL 연산자

```json
{
    "where": [{ "deletedAt": { "operator": "NULL" } }]
}
```

### Relation 필드 검색

관계(Relation) 엔티티의 필드를 검색 조건으로 사용할 수 있습니다.

#### Entity 예시

```typescript
@Entity()
export class Question extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}

@Entity()
export class Category extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
```

#### Relation 필드 where 조건

관계 엔티티의 필드를 검색하려면 `relationName.fieldName` 형식을 사용합니다:

```json
POST /questions/search
{
  "where": [
    { "category.name": { "operator": "LIKE", "operand": "tech%" } },
    { "user.email": { "operator": "=", "operand": "user@example.com" } }
  ]
}
```

이 경우 `category`와 `user` relation이 자동으로 join되어 검색됩니다.

### select 사용법

`select`를 사용하여 조회할 필드를 지정할 수 있습니다. 배열 형식으로 입력하면 내부적으로 TypeORM의 객체 형식으로 변환됩니다.

#### 기본 사용법

```json
{
    "select": ["id", "username", "email"],
    "where": [{ "status": { "operator": "=", "operand": "active" } }]
}
```

#### Relation 필드 select

관계 엔티티의 필드도 선택할 수 있습니다:

```json
{
    "select": ["id", "title", "category.id", "category.name", "user.id", "user.email"],
    "where": [{ "title": { "operator": "LIKE", "operand": "question%" } }]
}
```

내부적으로 다음과 같이 변환됩니다:

```typescript
{
  id: true,
  title: true,
  category: {
    id: true,
    name: true
  },
  user: {
    id: true,
    email: true
  }
}
```

### order 사용법

`order`를 사용하여 결과를 정렬할 수 있습니다.

#### 기본 사용법

```json
{
    "order": {
        "createdAt": "DESC",
        "id": "ASC"
    }
}
```

#### Relation 필드 order

관계 엔티티의 필드로도 정렬할 수 있습니다:

```json
{
    "order": {
        "category.name": "ASC",
        "createdAt": "DESC"
    }
}
```

### Pagination

Search API는 두 가지 pagination 방식을 지원합니다: `cursor`와 `offset`.

#### Cursor Pagination

기본 pagination 방식입니다. `take`와 `nextCursor`를 사용합니다:

```json
// 첫 번째 요청
{
  "where": [{ "status": { "operator": "=", "operand": "active" } }],
  "take": 20
}

// 응답
{
  "data": [...],
  "metadata": {
    "nextCursor": "eyJpZCI6MjB9",
    "total": 100
  }
}

// 다음 페이지 요청
{
  "nextCursor": "eyJpZCI6MjB9"
}
```

#### Offset Pagination

`limit`과 `offset`을 사용하는 전통적인 pagination 방식입니다:

```json
{
    "where": [{ "status": { "operator": "=", "operand": "active" } }],
    "limit": 20,
    "offset": 0
}
```

pagination 방식을 변경하려면 route 옵션에서 설정할 수 있습니다:

```typescript
@Crud({
    entity: User,
    routes: {
        search: { paginationType: PaginationType.OFFSET },
    },
})
```

### 전체 예시

다음은 relation 필드를 사용한 복잡한 검색 예시입니다:

```json
POST /questions/search
{
  "select": ["id", "title", "category.id", "category.name", "user.id", "user.email"],
  "where": [
    { "category.name": { "operator": "LIKE", "operand": "tech%" } },
    { "user.status": { "operator": "=", "operand": "active" } },
    { "createdAt": { "operator": ">=", "operand": "2024-01-01" } }
  ],
  "order": {
    "category.name": "ASC",
    "createdAt": "DESC"
  },
  "take": 20
}
```

이 요청은:

-   `category.name`이 "tech"로 시작하는
-   `user.status`가 "active"인
-   2024년 1월 1일 이후 생성된
-   질문들을 조회하며
-   `category.name`으로 오름차순, 그 다음 `createdAt`으로 내림차순 정렬합니다.

#### `CREATE`

```typescript
import { Type } from '@nestjs/common';
import { Author } from 'src/lib/interface';

interface CreateOptions {
    swagger?: {
        body?: Type<unknown>;
    };
    author?: Author;
}
```

#### `UPDATE`

```typescript
import { Type } from '@nestjs/common';
import { Author } from 'src/lib/interface';

interface UpdateOptions {
    params?: string[];
    swagger?: {
        body?: Type<unknown>;
    };
    author?: Author;
}
```

#### `DELETE`

```typescript
import { Author } from 'src/lib/interface';

interface DeleteOptions {
    params?: string[];
    softDelete?: boolean;
    author?: Author;
}
```

#### `UPSERT`

```typescript
interface UpsertOptions {
    params?: string[];
    swagger?: {
        body?: Type<unknown>;
    };
    author?: Author;
}
```

#### `RECOVER`

```typescript
interface RecoverOptions {
    params?: string[];
    author?: Author;
}
```

### only

(optional) route를 생성할 Method 목록을 지정합니다.

예를 들어 Create와 ReadOne에 대한 route만 생성하고 싶다면 다음과 같이 설정할 수 있습니다.

```typescript
import { Crud, Method } from '@nestjs-library/crud';

@Crud({ entity: User, only: [Method.CREATE,  Method.READ_ONE] })
```

## [Contributors](https://github.com/woowabros/nestjs-library-crud/graphs/contributors)

![Contributors](https://contrib.rocks/image?repo=woowabros/nestjs-library-crud)

---

## License

This library is licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for details.
