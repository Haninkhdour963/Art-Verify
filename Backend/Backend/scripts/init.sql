-- Backend/scripts/init.sql
IF NOT EXISTS(SELECT name FROM master.dbo.sysdatabases WHERE name = 'ArtVerify')
BEGIN
    CREATE DATABASE ArtVerify;
END
GO

USE ArtVerify;
GO

-- Ensure database is properly set up
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[__EFMigrationsHistory]') AND type in (N'U'))
BEGIN
    -- Database will be created by Entity Framework migrations
    PRINT 'ArtVerify database is ready for Entity Framework migrations';
END