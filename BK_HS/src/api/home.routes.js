const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { CreateHome } = require('../core/application/use-cases/home/CreateHome');
const { UpdateHome } = require('../core/application/use-cases/home/UpdateHome');
const { ListUserHomes } = require('../core/application/use-cases/home/ListUserHomes');
const { GetHome } = require('../core/application/use-cases/home/GetHome');
const { ListHomeMembers } = require('../core/application/use-cases/home/ListHomeMembers');
const { AddHomeMember } = require('../core/application/use-cases/home/AddHomeMember');
const { ChangeHomeMemberRole } = require('../core/application/use-cases/home/ChangeHomeMemberRole');
const { RemoveHomeMember } = require('../core/application/use-cases/home/RemoveHomeMember');
const { RequestHomeMembership } = require('../core/application/use-cases/home/RequestHomeMembership');
const { AnswerHomeMembership } = require('../core/application/use-cases/home/AnswerHomeMembership');
const { ListHomeMembershipRequests } = require('../core/application/use-cases/home/ListHomeMembershipRequests');
const { PostgresHomeRepository } = require('../core/infrastructure/repositories/postgres/PostgresHomeRepository');
const { HomeController } = require('./controllers/HomeController');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');

const homeRepository = new PostgresHomeRepository();
const homeController = new HomeController({
  createHome: new CreateHome({ homeRepository }),
  updateHome: new UpdateHome({ homeRepository }),
  listUserHomes: new ListUserHomes({ homeRepository }),
  getHome: new GetHome({ homeRepository }),
  listHomeMembers: new ListHomeMembers({ homeRepository }),
  addHomeMember: new AddHomeMember({ homeRepository }),
  changeHomeMemberRole: new ChangeHomeMemberRole({ homeRepository }),
  removeHomeMember: new RemoveHomeMember({ homeRepository }),
  requestHomeMembership: new RequestHomeMembership({ homeRepository }),
  answerHomeMembership: new AnswerHomeMembership({ homeRepository }),
  listHomeMembershipRequests: new ListHomeMembershipRequests({ homeRepository })
});
const requirePermission = createRequirePermission({
  permissionChecker: new PostgresPermissionChecker()
});

router.use(authenticate);

router.post('/', requirePermission('homes.manage'), asyncHandler((req, res) => homeController.create(req, res)));

router.get('/', asyncHandler((req, res) => homeController.list(req, res)));
router.put('/:homeId', requirePermission('homes.manage'), asyncHandler((req, res) => homeController.update(req, res)));
router.get('/:homeId/members', asyncHandler((req, res) => homeController.members(req, res)));
router.post('/:homeId/members', requirePermission('homes.manage'), asyncHandler((req, res) => homeController.addMember(req, res)));
router.patch('/:homeId/members/:memberUserId/role', requirePermission('homes.manage'), asyncHandler((req, res) => homeController.changeMemberRole(req, res)));
router.delete('/:homeId/members/:memberUserId', requirePermission('homes.manage'), asyncHandler((req, res) => homeController.removeMember(req, res)));
router.post('/:homeId/membership-requests', asyncHandler((req, res) => homeController.requestMembership(req, res)));
router.get('/:homeId/membership-requests', asyncHandler((req, res) => homeController.listMembershipRequests(req, res)));
router.patch('/membership-requests/:requestId', requirePermission('homes.manage'), asyncHandler((req, res) => homeController.answerMembership(req, res)));
router.get('/:homeId', asyncHandler((req, res) => homeController.get(req, res)));

module.exports = router;
