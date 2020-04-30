'use strict';

const MALE = 'male';
const FEMALE = 'female';

/**
 * Итератор по друзьям
 * @constructor
 * @param {Object[]} friends
 * @param {Filter} filter
 */
function Iterator(friends, filter) {
    if (!(filter instanceof Filter)) {
        throw new TypeError('Object for filtration must be a Filter');
    }
    this.nextIndex = 0;
    this.friends = filter.filterArray(getComponentsOfFriendsWithLevel(friends, friends.length));
}

Iterator.prototype.next = function () {
    if (this.nextIndex < this.friends.length) {
        return this.friends[this.nextIndex++];
    }

    return null;
};

Iterator.prototype.done = function () {
    return this.nextIndex >= this.friends.length;
};

/**
 * Итератор по друзьям с ограничением по кругу
 * @extends Iterator
 * @constructor
 * @param {Object[]} friends
 * @param {Filter} filter
 * @param {Number} maxLevel – максимальный круг друзей
 */
function LimitedIterator(friends, filter, maxLevel) {
    if (!(filter instanceof Filter)) {
        throw new TypeError('Object for filtration must be a Filter');
    }
    this.nextIndex = 0;
    this.friends = filter.filterArray(getComponentsOfFriendsWithLevel(
        friends,
        maxLevel
    ));
}

LimitedIterator.prototype = Object.create(Iterator.prototype, {
    constructor: { value: LimitedIterator }
});

function LevelConstructor(friend, level) {
    this.friend = friend;
    this.level = level;
}

/**
 * Друзьям в каждой компоненте присваем их номер, объединяем
 * и возвращаем друзей с максимально допустимым уровнем вложенности,
 * отсортированным в алфавитном порядке имен
 * @param{Object[]} friends
 * @param{Number} maxLevel
 * @returns{Object[]}
 */
function getComponentsOfFriendsWithLevel(friends, maxLevel) {
    const graphComponents = findConnectedComponents(friends);
    const componentsWithLevels = graphComponents.reduce((levels, currentComponent) => {
        const newFriendsWithLevels = getFriendsLevels(currentComponent, maxLevel, []);
        for (const friend of newFriendsWithLevels) {
            const level = Number(friend.level);
            if (!levels[level]) {
                levels[level] = [];
            }
            levels[level].push(friend);
        }

        return levels;
    }, {});

    Object.values(componentsWithLevels).map(friendsLevel =>
        friendsLevel.sort((x, y) => x.friend.name.localeCompare(y.friend.name)));

    return Object.values(componentsWithLevels)
        .reduce((res, curr) => res.concat(curr), [])
        .map(x => x.friend);
}

/**
 * Каждому другу из компоненты присваиваем комер его круга
 * @param{Object[]} friends
 * @param{Number} maxLevel
 * @param{Object[]} nodes
 * @returns{Object[]}
 */
function getFriendsLevels(friends, maxLevel, nodes) {
    nodes = friends
        .filter(friend => friend.best)
        .map(bestFriend => new LevelConstructor(bestFriend, 1));
    if (maxLevel <= 0 || nodes.length < 1) {
        return [];
    }

    return setLevelToFriend(nodes, friends, 2, maxLevel);
}

function setLevelToFriend(nodes, friends, currentLevel, maxLevel) {
    if (currentLevel > maxLevel || friends.length === nodes.length) {
        return nodes;
    }
    const setOfAllFriends = new Set();
    for (const graphNode of nodes) {
        for (const friendOfFriend of graphNode.friend.friends) {
            setOfAllFriends.add(friends.find(x => x.name === friendOfFriend));
        }
    }

    const allFriends = Array.from(setOfAllFriends)
        .filter(x => x)
        .filter(x => !nodes.map(elem => elem.friend).includes(x));
    for (const friend of allFriends) {
        nodes.push(new LevelConstructor(friend, currentLevel));
    }

    return setLevelToFriend(nodes, friends, ++currentLevel, maxLevel);
}

/**
 * Фильтр друзей
 * @constructor
 */
function Filter() { }

Filter.prototype.filterArray = function (arrayToFilter) {
    return this.filterFunction ? arrayToFilter.filter(friend => this.filterFunction(friend))
        : arrayToFilter;
};

/**
 * Фильтр друзей
 * @extends Filter
 * @constructor
 */
function MaleFilter() {
    this.filterFunction = person => person.gender === MALE;
}

MaleFilter.prototype = Object.create(Filter.prototype, {
    constructor: { value: MaleFilter }
});

/**
 * Фильтр друзей-девушек
 * @extends Filter
 * @constructor
 */
function FemaleFilter() {
    this.filterFunction = person => person.gender === FEMALE;
}

FemaleFilter.prototype = Object.create(Filter.prototype, {
    constructor: { value: FemaleFilter }
});

/**
 * Поиск компонент связности графа
 * @param{Object[]} graph
 * @returns {[]}
 */
function findConnectedComponents(graph) {
    const visited = [];
    const components = [];
    const infinityCircle = true;
    while (infinityCircle) {
        const node = graph.find(vertex => !visited.includes(vertex.name));
        if (!node) {
            break;
        }
        const search = breadthSearch(node, graph);
        for (const searchNode of search) {
            visited.push(searchNode.name);
        }
        components.push(search);
    }

    return components;
}

function breadthSearch(startNode, graph) {
    const visited = [startNode];
    const queue = [startNode];
    while (queue.length > 0) {
        const node = queue.shift();
        const nextNodes = graph
            .filter(x => node.friends.includes(x.name))
            .filter(x => !visited.includes(x));
        for (const nextNode of nextNodes) {
            visited.push(nextNode);
            queue.push(nextNode);
        }
    }

    return visited;
}

exports.Iterator = Iterator;
exports.LimitedIterator = LimitedIterator;

exports.Filter = Filter;
exports.MaleFilter = MaleFilter;
exports.FemaleFilter = FemaleFilter;
