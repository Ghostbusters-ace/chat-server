import { Socket } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server;
  users = 0;
  nicknames: Map<string, string> = new Map();

  async handleConnection() {
    // A client has connected
    this.users++;
    // Notify connected clients of current users
    this.server.emit('users', this.users);
  }

  /* async handleDisconnect(client: Socket) {
    // A client has disconnected
    this.users--;
    // Notify connected clients of current users
    this.server.emit('users', this.users);
  } */

  handleDisconnect(client: Socket) {
    this.server.emit('users-changed', {
      user: this.nicknames[client.id],
      event: 'left',
    });
    this.nicknames.delete(client.id);

    this.users--;

    this.server.emit('users', this.users);
  }

  @SubscribeMessage('set-nickname')
  setNickname(client: Socket, nickname: string) {
    this.nicknames[client.id] = nickname;
    this.server.emit('users-changed', { user: nickname, event: 'joined' });
  }

  @SubscribeMessage('chat')
  async onChat(client, message) {
    client.broadcast.emit('chat', message);
  }

  @SubscribeMessage('add-message')
  addMessage(client: Socket, message) {
    this.server.emit('message', {
      text: message.text,
      from: this.nicknames[client.id],
      created: new Date(),
    });
  }
}
