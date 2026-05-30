import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { getPagination } from '../common/utils/pagination.util';
import { GetUnilevelTreeDto } from './dto';
import { User } from './entities/user.entity';
import {
  UnilevelTreeNode,
  UnilevelTreeResponse,
} from './interfaces/unilevel-tree.interface';
import {
  PersonalNetworkNode,
  PersonalNetworkResponse,
} from './interfaces/personal-network.interface';

@Injectable()
export class NetworkService {
  private readonly logger = new Logger(NetworkService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUnilevelTree(
    requestingUser: { id: string; phone: string },
    unilevelTreeDto: GetUnilevelTreeDto,
  ): Promise<UnilevelTreeResponse> {
    const { userId, maxLevel = 10 } = unilevelTreeDto;

    const user = await this.userRepository.findOne({
      where: { id: Number.parseInt(requestingUser.id) },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    this.logger.log(
      `Usuario encontrado - roleId: ${user.role?.id}, roleIdType: ${typeof user.role?.id}, roleName: ${user.role?.name}`,
    );

    const roleId = Number(user.role?.id);
    const isAdmin =
      roleId === 1 ||
      user.role?.name?.toLowerCase() === 'admin' ||
      user.role?.name === 'Admin';

    this.logger.log(`roleId convertido: ${roleId}, isAdmin: ${isAdmin}`);

    const targetUserId =
      isAdmin && userId ? userId : Number.parseInt(requestingUser.id);

    const tree: UnilevelTreeNode[] = await this.userRepository.query(
      `SELECT * FROM get_unilevel_family_tree($1, $2, $3)`,
      [targetUserId, maxLevel, isAdmin],
    );

    const maxLevelInTree =
      tree.length > 0 ? Math.max(...tree.map((node) => node.level)) : 0;

    return {
      tree,
      totalNodes: tree.length,
      maxLevel: maxLevelInTree,
    };
  }

  async getPersonalNetwork(
    requestingUser: { id: string; phone: string; role: string },
    userId?: number,
    paginationDto?: PaginationDto,
  ): Promise<PersonalNetworkResponse> {
    const { page, limit, skip } = getPagination(paginationDto);
    const isAdmin = requestingUser.role === 'Admin';
    const targetUserId =
      isAdmin && userId ? userId : Number.parseInt(requestingUser.id);

    const network: PersonalNetworkNode[] = await this.userRepository.query(
      `SELECT * FROM get_personal_network($1)`,
      [targetUserId],
    );

    this.assignLevels(network, targetUserId);

    const paginatedNetwork = network.slice(skip, skip + limit);

    return {
      network: paginatedNetwork,
      totalNodes: network.length,
      meta: {
        total: network.length,
        page,
        limit,
        totalPages: Math.ceil(network.length / limit),
      },
    };
  }

  private assignLevels(network: PersonalNetworkNode[], rootId: number): void {
    const childrenByFather = new Map<number, PersonalNetworkNode[]>();
    for (const node of network) {
      const list = childrenByFather.get(node.father) ?? [];
      list.push(node);
      childrenByFather.set(node.father, list);
    }

    const queue: Array<{ fatherId: number; level: number }> = [
      { fatherId: rootId, level: 0 },
    ];

    while (queue.length > 0) {
      const { fatherId, level } = queue.shift()!;
      const children = childrenByFather.get(fatherId) ?? [];
      for (const child of children) {
        child.level = level + 1;
        queue.push({ fatherId: child.id, level: level + 1 });
      }
    }

    for (const node of network) {
      if (node.level === undefined || node.level === null) {
        node.level = 0;
      }
    }
  }
}
