import { GraphQLUpload } from "apollo-server-koa";
import { StorageService } from "../../services/storage/storage-service";
import { KoaContext } from "server/types/koa-types";
import {
  Arg,
  Authorized,
  Ctx,
  Mutation,
  Resolver,
  ForbiddenError,
  FieldResolver,
  Int,
  Root,
  Query,
  UnauthorizedError,
} from "type-graphql";
import { Service } from "typedi";
import { getConnection, getRepository, Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { CreateAlbumInput } from "../inputs/album-input";
import { FileType } from "../scalars/file-scalar";
import { Album } from "../entity/Album";
import { Travel } from "../entity/Travel";
import { User } from "../entity/User";
import { Photo } from "../entity/Photo";
import { ReactionEntity } from "../entity/ReactionEntitiy";

@Service()
@Resolver(() => Album)
export class AlbumResolver {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
    @InjectRepository(Travel)
    private readonly travelRepository: Repository<Travel>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly storageService: StorageService
  ) {}

  @Mutation(() => Album)
  @Authorized()
  async createAlbum(
    @Arg("input") { name, travelId }: CreateAlbumInput,
    @Ctx() { session }: KoaContext
  ) {
    const travel = await this.travelRepository
      .createQueryBuilder("travel")
      .leftJoinAndSelect("travel.entity", "reactionentity")
      .andWhere("travel.entity = :travelId", { travelId })
      .getOne();

    if (!travel) throw new Error("Travel not found");

    const entity = await travel.entity;
    const owner = await entity.owner;
    const user = session!.user as User;

    if (owner.uuid !== user.uuid) throw new ForbiddenError();

    const album = this.albumRepository.create({
      name,
      travel: entity.uuid as any,
      isPublic: false,
      photos: [],
      entity: ReactionEntity.create({ owner }),
    });
    return this.albumRepository.save(album);
  }

  @Query(() => Album)
  async album(@Arg("id") uuid: string, @Ctx() { session }: KoaContext) {
    const album = await this.albumRepository.findOneOrFail({
      where: { entity: uuid },
      relations: ["entity"],
    });

    if (!album) throw new Error("Album does not exist");
    const sessionUser = session?.user as User | null;
    const entiy = await album.entity;
    const user = await entiy.owner;
    const isPublic = album.isPublic;
    if (!isPublic && sessionUser?.uuid !== user.uuid) {
      throw new UnauthorizedError();
    } else {
      return album;
    }
  }

  @Mutation(() => Album)
  async addPhotosToAlbum(
    @Arg("albumUuid") albumUuid: string,
    @Arg("files", () => [GraphQLUpload]) upFiles: Promise<FileType>[],
    @Ctx() { session }: KoaContext
  ) {
    const files = await Promise.all(upFiles);
    const album = await this.albumRepository.findOneOrFail({
      where: { entity: albumUuid },
      relations: ["entity"],
    });

    if (!album) throw new Error("Album not found");
    const entity = await album.entity;
    const owner = await entity.owner;

    if (owner.uuid !== session?.user.uuid) throw new UnauthorizedError();

    const photos = await this.storageService.uploadPhotos(files);

    const allPhotos = photos.map((photo) => {
      return this.photoRepository.create({
        ...photo,
        entity: ReactionEntity.create({ owner }),
      });
    });

    const photosSaved = await getRepository(Photo).save(allPhotos);

    await getConnection()
      .createQueryBuilder()
      .relation(Album, "photos")
      .of(entity.uuid)
      .add(photosSaved);

    return album;
  }

  @FieldResolver(() => [Photo])
  async photos(@Root() album: Album): Promise<Photo[]> {
    const albumUuid = album.uuid;

    const curentAlbum = await this.albumRepository
      .createQueryBuilder("album")
      .leftJoinAndSelect("album.photos", "photo")
      .leftJoin("album.entity", "reactionentity")
      .where("reactionentity.uuid = :albumUuid", { albumUuid })
      .getOne();
    if (!curentAlbum) throw new Error("Cannot find album: " + album.entity);

    return this.storageService.getPhotos(await curentAlbum.photos);
  }

  @FieldResolver(() => Int)
  async photoCount(@Root() album: Album) {
    const curentAlbum = await this.albumRepository
      .createQueryBuilder("album")
      .loadRelationCountAndMap("album.photos", "album.photos")
      .leftJoin("album.entity", "reactionentity")
      .where("reactionentity.uuid = :albumUuid", { albumUuid: album.uuid })
      .getOneOrFail();

    if (!curentAlbum) throw new Error("Cannot find album: " + album.entity);
    return curentAlbum.photos;
  }

  @FieldResolver(() => User)
  async owner(@Root() album: Album) {
    const curentAlbum = await this.albumRepository.findOneOrFail(album.uuid, {
      relations: ["entity"],
    });

    const owner = await (await curentAlbum.entity).owner;
    return owner;
  }
}
