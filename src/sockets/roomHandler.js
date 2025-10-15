/**
 * Socket event handlers for room management
 */


const roomHandler = (io, socket, roomService, gameController) => {
  
  // Create a new room
  socket.on('create_room', async (data, callback) => {
    try {
 
      const result =await roomService.createRoom(socket.playerId, data);
      
      if (result.success) {
        // Join the socket to the room
        socket.join(result.room.code);
        socket.roomCode = result.room.code;

        // Notify the creator
        callback({
          success: true,
          room: result.room,
          message: 'Room created successfully'
        });
        
        // Log room creation
        console.log(`Room created: ${result.room.code} by ${socket.id}`);
        

      } else {
        callback({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get player room info
  socket.on('get_player_room_info', async (callback) => {
    try {
      const result = await roomService.getPlayerRoom(socket.playerId);
      callback(result);
    } catch (error) {
      console.error('Error getting Player room info:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

   // Get room info
  socket.on('get_room_info', async (callback) => {
    try {
      const result = await roomService.getRoom(socket.roomCode);
      callback(result);
    } catch (error) {
      console.error('Error getting Player room info:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });


  // Join an existing room
  socket.on('join_room', async (data, callback) => {
    try {
      const {roomCode} = data;
      const result = await roomService.joinRoom(socket.playerId, roomCode);
      
      if (result.success) {
        // Join the socket to the room
        socket.join(roomCode);
        
        // Notify the joiner
        callback({
          success: true,
          room: result.room,
          message: 'Joined room successfully'
        });
        
        // Notify other players in the room
        socket.to(roomCode).emit('player_joined', {
          player: result.room.players.find(p => p.id === socket.id),
          room: result.room
        });
        
        // Log room join
        console.log(`Player ${socket.id} joined room: ${roomCode}`);
      } else {
        callback({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Leave a room
  socket.on('leave_room', async (callback) => {
    try {
      const result = roomService.leaveRoom(socket.id);
      
      if (result.success) {
        // Get room code before leaving
        const playerRoom = roomService.getPlayerRoom(socket.id);
        const roomCode = playerRoom.success ? playerRoom.room.code : null;
        
        if (roomCode) {
          // Leave the socket room
          socket.leave(roomCode);
          
          // Notify other players if room still exists
          if (!result.roomDeleted) {
            socket.to(roomCode).emit('player_left', {
              playerId: socket.id,
              room: result.room,
              wasHost: result.wasHost,
              newHost: result.newHost
            });
          }
        }
        
        callback({
          success: true,
          message: result.roomDeleted ? 'Left room and room was deleted' : 'Left room successfully'
        });
        
        // Log room leave
        console.log(`Player ${socket.id} left room`);
      } else {
        callback({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Set player ready status
  socket.on('set_ready', async (data, callback) => {
    try {
      const { isReady } = data;
      const result = roomService.setPlayerReady(socket.id, isReady);
      
      if (result.success) {
        // Notify all players in the room
        const roomCode = result.room.code;
        io.to(roomCode).emit('player_ready_changed', {
          playerId: socket.id,
          isReady,
          room: result.room,
          allReady: result.allReady
        });
        
        callback({
          success: true,
          message: `Player ${isReady ? 'ready' : 'not ready'}`
        });
        
        // Log ready status change
        console.log(`Player ${socket.id} is ${isReady ? 'ready' : 'not ready'}`);
      } else {
        callback({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error setting ready status:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Start game
  socket.on('start_game', async (callback) => {
    try {
      const playerRoom = roomService.getPlayerRoom(socket.id);
      if (!playerRoom.success) {
        callback({
          success: false,
          error: 'Player is not in any room'
        });
        return;
      }
      
      const roomCode = playerRoom.room.code;
      const result = gameController.startGame(roomCode, socket.id);
      
      if (result.success) {
        // Notify all players in the room
        io.to(roomCode).emit('game_started', {
          room: result.room,
          gameData: result.gameData
        });
        
        callback({
          success: true,
          message: 'Game started successfully'
        });
        
        // Log game start
        console.log(`Game started in room: ${roomCode}`);
      } else {
        callback({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error starting game:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // End game
  socket.on('end_game', async (callback) => {
    try {
      const playerRoom = roomService.getPlayerRoom(socket.id);
      if (!playerRoom.success) {
        callback({
          success: false,
          error: 'Player is not in any room'
        });
        return;
      }
      
      const roomCode = playerRoom.room.code;
      const result = gameController.endGame(roomCode, socket.id);
      
      if (result.success) {
        // Notify all players in the room
        io.to(roomCode).emit('game_ended', {
          room: result.room,
          finalScores: result.finalScores
        });
        
        callback({
          success: true,
          message: 'Game ended successfully'
        });
        
        // Log game end
        console.log(`Game ended in room: ${roomCode}`);
      } else {
        callback({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error ending game:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Update player score
  socket.on('update_score', async (data, callback) => {
    try {
      const { score } = data;
      const playerRoom = roomService.getPlayerRoom(socket.id);
      if (!playerRoom.success) {
        callback({
          success: false,
          error: 'Player is not in any room'
        });
        return;
      }
      
      const roomCode = playerRoom.room.code;
      const result = gameController.updatePlayerScore(roomCode, socket.id, score);
      
      if (result.success) {
        // Notify all players in the room
        io.to(roomCode).emit('score_updated', {
          playerId: socket.id,
          newScore: result.playerScore,
          room: result.room
        });
        
        callback({
          success: true,
          message: 'Score updated successfully'
        });
      } else {
        callback({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error updating score:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Add points to player score
  socket.on('add_score', async (data, callback) => {
    try {
      const { points } = data;
      const playerRoom = roomService.getPlayerRoom(socket.id);
      if (!playerRoom.success) {
        callback({
          success: false,
          error: 'Player is not in any room'
        });
        return;
      }
      
      const roomCode = playerRoom.room.code;
      const result = gameController.addPlayerScore(roomCode, socket.id, points);
      
      if (result.success) {
        // Notify all players in the room
        io.to(roomCode).emit('score_updated', {
          playerId: socket.id,
          newScore: result.playerScore,
          room: result.room
        });
        
        callback({
          success: true,
          message: 'Score added successfully'
        });
      } else {
        callback({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error adding score:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get leaderboard
  socket.on('get_leaderboard', async (callback) => {
    try {
      const playerRoom = roomService.getPlayerRoom(socket.id);
      if (!playerRoom.success) {
        callback({
          success: false,
          error: 'Player is not in any room'
        });
        return;
      }
      
      const roomCode = playerRoom.room.code;
      const result = gameController.getLeaderboard(roomCode);
      
      callback(result);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      callback({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      const result = roomService.leaveRoom(socket.id);
      
      if (result.success && !result.roomDeleted) {
        // Notify other players in the room
        const roomCode = result.room.code;
        socket.to(roomCode).emit('player_disconnected', {
          playerId: socket.id,
          room: result.room,
          wasHost: result.wasHost,
          newHost: result.newHost
        });
      }
      
      console.log(`Player ${socket.id} disconnected`);
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  });
};

module.exports = roomHandler;