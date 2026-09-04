const { HomeResponse } = require('../../core/application/dtos/responses/HomeResponse');
const { CreateHomeRequest } = require('../../core/application/dtos/requests/CreateHomeRequest');
const { UpdateHomeRequest } = require('../../core/application/dtos/requests/UpdateHomeRequest');
const { HomeMemberResponse } = require('../../core/application/dtos/responses/HomeMemberResponse');
const { AddHomeMemberRequest } = require('../../core/application/dtos/requests/AddHomeMemberRequest');
const { ChangeHomeMemberRoleRequest } = require('../../core/application/dtos/requests/ChangeHomeMemberRoleRequest');
const { AnswerHomeMembershipRequest } = require('../../core/application/dtos/requests/AnswerHomeMembershipRequest');
const { HomeMembershipRequestResponse } = require('../../core/application/dtos/responses/HomeMembershipRequestResponse');
const { paginate } = require('../../shared/http');

class HomeController {
  constructor({ createHome, updateHome, listUserHomes, getHome, listHomeMembers, addHomeMember, changeHomeMemberRole, removeHomeMember, requestHomeMembership, answerHomeMembership, listHomeMembershipRequests }) {
    this.createHome = createHome;
    this.updateHome = updateHome;
    this.listUserHomes = listUserHomes;
    this.getHome = getHome;
    this.listHomeMembers = listHomeMembers;
    this.addHomeMember = addHomeMember;
    this.changeHomeMemberRole = changeHomeMemberRole;
    this.removeHomeMember = removeHomeMember;
    this.requestHomeMembership = requestHomeMembership;
    this.answerHomeMembership = answerHomeMembership;
    this.listHomeMembershipRequests = listHomeMembershipRequests;
  }

  async create(req, res) {
    const input = CreateHomeRequest.fromRequest(req.body);
    const home = await this.createHome.execute({
      userId: req.user.id,
      ...input
    });

    res.status(201).json({ data: HomeResponse.fromEntity(home) });
  }

  async list(req, res) {
    const homes = await this.listUserHomes.execute(req.user.id);
    const result = paginate(homes.map(HomeResponse.fromEntity), req.query, { sortFields: ['name', 'city', 'createdAt'] });
    res.json({ data: result.items, pagination: result.pagination });
  }

  async update(req, res) {
    const input = UpdateHomeRequest.fromRequest(req.body);
    const home = await this.updateHome.execute({
      userId: req.user.id,
      homeId: req.params.homeId,
      ...input
    });
    res.json({ data: HomeResponse.fromEntity(home) });
  }

  async get(req, res) {
    const home = await this.getHome.execute({ userId: req.user.id, homeId: req.params.homeId });
    res.json({ data: HomeResponse.fromEntity(home) });
  }

  async members(req, res) {
    const members = await this.listHomeMembers.execute({ userId: req.user.id, homeId: req.params.homeId });
    const result = paginate(members.map(HomeMemberResponse.fromRow), req.query, { sortFields: ['fullName', 'email', 'homeRole', 'assignedAt'] });
    res.json({ data: result.items, pagination: result.pagination });
  }

  async addMember(req, res) {
    const input = AddHomeMemberRequest.fromRequest(req.body);
    const member = await this.addHomeMember.execute({
      userId: req.user.id,
      homeId: req.params.homeId,
      ...input
    });
    res.status(201).json({ data: HomeMemberResponse.fromRow(member) });
  }

  async changeMemberRole(req, res) {
    const input = ChangeHomeMemberRoleRequest.fromRequest(req.body);
    const member = await this.changeHomeMemberRole.execute({
      userId: req.user.id,
      homeId: req.params.homeId,
      memberUserId: req.params.memberUserId,
      ...input
    });
    res.json({ data: HomeMemberResponse.fromRow(member) });
  }

  async removeMember(req, res) {
    await this.removeHomeMember.execute({ userId: req.user.id, homeId: req.params.homeId, memberUserId: req.params.memberUserId });
    res.status(204).send();
  }

  async requestMembership(req, res) {
    const request = await this.requestHomeMembership.execute({ userId: req.user.id, homeId: req.params.homeId });
    res.status(201).json({ data: HomeMembershipRequestResponse.fromRow(request) });
  }

  async answerMembership(req, res) {
    const input = AnswerHomeMembershipRequest.fromRequest(req.body);
    const request = await this.answerHomeMembership.execute({ userId: req.user.id, requestId: req.params.requestId, ...input });
    res.json({ data: HomeMembershipRequestResponse.fromRow(request) });
  }

  async listMembershipRequests(req, res) {
    const requests = await this.listHomeMembershipRequests.execute({ userId: req.user.id, homeId: req.params.homeId });
    const result = paginate(requests.map(HomeMembershipRequestResponse.fromRow), req.query, { sortFields: ['status', 'requestedAt', 'answeredAt'], filter: (request) => !req.query.status || request.status === req.query.status });
    res.json({ data: result.items, pagination: result.pagination });
  }
}

module.exports = { HomeController };
